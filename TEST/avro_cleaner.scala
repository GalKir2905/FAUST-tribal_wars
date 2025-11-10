import java.io.{BufferedWriter, File, FileWriter, PrintWriter}
import java.net.URI
import java.time.format.DateTimeFormatter
import java.time.{Instant, LocalDate, LocalDateTime, ZoneOffset, ZonedDateTime}
import java.util.Locale

import org.apache.hadoop.conf.Configuration
import org.apache.hadoop.fs.{FileStatus, FileSystem, Path}

import scala.collection.mutable
import scala.util.control.NonFatal

// Логгер, создаваемый после определения имени реплики
private var logFile: File = _
private var logWriter: PrintWriter = _

def log(message: String): Unit = {
  val line = s"[${Instant.now()}] $message"
  println(line)
  if (logWriter != null) {
    logWriter.println(line)
    logWriter.flush()
  }
}

try {
  // Фактическое время старта
  val jobStartInstant = Instant.now()

  // Наборы ключей конфигурации Spark для получения параметров запуска
  // Каждый список содержит альтернативные названия одного и того же параметра
  val replicaParamKeys = Seq("spark.cleaner.replica", "spark.cleaner.replica.name")
  val runDateParamKeys = Seq("spark.cleaner.runDate", "spark.cleaner.startDate", "spark.cleaner.date")
  val namespaceParamKeys = Seq("spark.cleaner.namespaces", "spark.cleaner.namespace")
  val dryRunParamKeys = Seq("spark.cleaner.dryRun", "spark.cleaner.dry_run", "spark.cleaner.dry-run")

  // Функция выбора первого непустого параметра из списка возможных ключей
  // Используем fold для последовательной проверки доступных ключей
  def firstNonEmpty(keys: Seq[String]): Option[String] =
    keys.foldLeft(Option.empty[String]) { (acc, key) =>
      acc.orElse(spark.conf.getOption(key).map(_.trim).filter(_.nonEmpty))
    }

  // Читаем список namespace'ов, разделённых запятой
  val rawNamespaces = firstNonEmpty(namespaceParamKeys)
    .map(_.split(",").map(_.trim).filter(_.nonEmpty).toSeq)
    .getOrElse(Seq.empty)

  // Проверяем, что namespace'ы заданы
  if (rawNamespaces.isEmpty) {
    throw new IllegalArgumentException("No HDFS namespaces provided. Set spark.cleaner.namespace or spark.cleaner.namespaces.")
  }

  // Определяем имя реплики и валидируем, что оно задано явно
  val replicaName = firstNonEmpty(replicaParamKeys).getOrElse {
    throw new IllegalArgumentException("Replica name must be provided via spark.cleaner.replica or spark.cleaner.replica.name.")
  }
  // После этой точки предполагаем, что все пути будут строиться с конкретным именем реплики

  // Инициализируем файл логов с учётом имени реплики
  logFile = new File(s"log_${replicaName}_avro_cleaner.txt")
  logWriter = new PrintWriter(new BufferedWriter(new FileWriter(logFile, true)))

  // Парсим дату запуска, поддерживая несколько форматов, и рассчитываем момент времени
  // В зависимости от формата даты используем разные парсеры
  val runInstant = firstNonEmpty(runDateParamKeys)
    .flatMap { value =>
      val parsers = Seq[ String => Option[Instant] ](
        // ISO-формат с часовым поясом
        v => scala.util.Try(Instant.parse(v)).toOption,
        // Локальное время без указания часового пояса
        v => scala.util.Try(LocalDateTime.parse(v)).toOption.map(_.toInstant(ZoneOffset.UTC)),
        // Только дата без времени, считаем начало суток
        v => scala.util.Try(LocalDate.parse(v)).toOption.map(_.atStartOfDay().toInstant(ZoneOffset.UTC)),
        // Формат "yyyy-MM-dd HH:mm:ss"
        v => scala.util.Try(LocalDateTime.parse(v, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).toOption.map(_.toInstant(ZoneOffset.UTC)),
        // Формат "yyyyMMddHHmmss"
        v => scala.util.Try(LocalDateTime.parse(v, DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))).toOption.map(_.toInstant(ZoneOffset.UTC))
      )
      parsers.view.flatMap(parser => parser(value)).headOption
    }
    .getOrElse(jobStartInstant)

  // Приводим момент запуска к UTC и вычисляем отсечку «минус 2 месяца»
  val runZoned = ZonedDateTime.ofInstant(runInstant, ZoneOffset.UTC)
  val cutoffInstant = runZoned.minusMonths(2).toInstant

  // Шаблоны путей для поиска целевых каталогов (зависит от реплики)
  // В каждый шаблон будет подставлено имя реплики
  val templatePaths = Seq(
    "data/core/internal/%s/src/GGDIRECT/HB/import_results",
    "data/core/internal/%s/src/ggdirect/hb/import_results",
    "data/core/internal/%s/src/sidec/heartbeats/import_results",
    "data/core/internal/%s/src/streamgate/heartbeats/import_results",
    "data/core/internal/%s/src/cdc/heartbeats/import_results"
  )

  // Регулярное выражение для разбора названия каталога периода YYYYMMDDhhmmss.*
  val periodPattern = "^([0-9]{14})(?:\\..*)?$".r
  val periodFormatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss")

  // Определяем режим dry-run (если true — только логируем, без удаления) 
  val dryRun = firstNonEmpty(dryRunParamKeys)
    .map(_.toLowerCase(Locale.ROOT))
    .exists(value => value == "true" || value == "1" || value == "yes")

  // Логируем стартовые параметры
  log(s"Avro Cleaner v1.0")
  log(s"Log file: ${logFile.getAbsolutePath}")
  log(s"Job start (UTC): $jobStartInstant")
  log(s"Configured run date: $runZoned")
  log(s"Replica name: $replicaName")
  log(s"Namespaces to process: ${rawNamespaces.mkString(", ")}")
  log(s"Cutoff instant (older than this will be removed): $cutoffInstant")
  log(s"Dry run mode: $dryRun (directories will ${if (dryRun) "not " else ""}be deleted)")

  // Общая Hadoop-конфигурация и списки удалённых/планируемых каталогов
  val hadoopConf = new Configuration()
  val deletedPaths = mutable.ListBuffer[String]()
  val plannedPaths = mutable.ListBuffer[String]()

  // Обрабатываем каждый namespace по очереди
  rawNamespaces.foreach { namespace =>
    // Логируем namespace, чтобы понимать контекст выполнения
    log(s"-- Processing namespace: $namespace")
    val namespaceUri = new URI(s"hdfs://$namespace")
    // Получаем файловую систему, используя конкретный namespace
    val fs = FileSystem.get(namespaceUri, hadoopConf)
    // Буфер с кандидатами на удаление внутри namespace
    val namespaceCandidates = mutable.ListBuffer[Path]()

    try {
      // Проходим по всем шаблонам путей
      templatePaths.foreach { template =>
        // Строим полный путь с учетом текущего namespace и реплики
        val pattern = "hdfs://" + namespace + "/" + String.format(Locale.ROOT, template, replicaName)
        log(s"  Pattern: $pattern")

        // Получаем список базовых директорий по маске (glob)
        val baseDirs: Array[FileStatus] =
          try {
            Option(fs.globStatus(new Path(pattern))).getOrElse(Array.empty)
          } catch {
            case NonFatal(e) =>
              log(s"    Unable to list pattern $pattern: ${e.getMessage}")
              Array.empty
          }

        if (baseDirs.isEmpty) {
          log(s"    No directories matched pattern.")
        }

        // Обрабатываем каждую найденную базовую директорию
        baseDirs.filter(_.isDirectory).foreach { baseDir =>
          val basePath = baseDir.getPath
          log(s"    Inspecting base directory: $basePath")

          // Получаем список подкаталогов периода
          val periodDirs: Array[FileStatus] =
            try {
              // listStatus возвращает все файлы и каталоги; фильтруем только каталоги
              fs.listStatus(basePath).filter(_.isDirectory)
            } catch {
              case NonFatal(e) =>
                log(s"      Cannot access $basePath: ${e.getMessage}")
                Array.empty
            }

          if (periodDirs.isEmpty) {
            log(s"      No period directories found.")
          }

          val outdated = mutable.ListBuffer[Path]()

          // Фильтруем каталоги с периодами старше отсечки
          periodDirs.foreach { status =>
            val dirPath = status.getPath
            val dirName = dirPath.getName

            dirName match {
              case periodPattern(ts) =>
                // Пробуем распарсить название каталога в дату-период
                val periodInstant = scala.util.Try {
                  LocalDateTime.parse(ts, periodFormatter).toInstant(ZoneOffset.UTC)
                }.getOrElse {
                  log(s"        Failed to parse period timestamp in $dirPath")
                  null
                }

                if (periodInstant != null && periodInstant.isBefore(cutoffInstant)) {
                  // Если каталог старше пороговой даты, добавляем в список на удаление
                  outdated += dirPath
                }

              case _ =>
                // Если название не похоже на период, игнорируем каталог
                log(s"        Skipping directory (name does not match period pattern): $dirPath")
            }
          }

          // Логируем устаревшие каталоги периода
          if (outdated.nonEmpty) {
            log(s"      Found ${outdated.size} outdated period directories:")
            outdated.foreach(p => log(s"        - $p"))
            namespaceCandidates ++= outdated
          } else {
            log(s"      No outdated directories in $basePath")
          }
        }
      }

      // Удаляем уникальные устаревшие каталоги в текущем namespace
      val uniqueCandidates = namespaceCandidates.distinct
      if (uniqueCandidates.isEmpty) {
        log(s"  No directories to delete in namespace $namespace.")
      } else {
        // Перед удалением фиксируем количество кандидатов
        log(s"  Preparing to ${if (dryRun) "simulate deletion of" else "delete"} ${uniqueCandidates.size} directories in namespace $namespace.")
        uniqueCandidates.foreach { path =>
          try {
            if (dryRun) {
              // В режиме dry-run только фиксируем потенциальное удаление
              log(s"    Dry run — would delete: $path")
              plannedPaths += path.toString
            } else {
              if (fs.delete(path, true)) {
                // При успешном удалении добавляем путь в итоговый список
                log(s"    Deleted: $path")
                deletedPaths += path.toString
              } else {
                log(s"    Failed to delete: $path")
              }
            }
          } catch {
            case NonFatal(e) =>
              // Ошибка удаления не должна прерывать всю обработку; логируем и идём дальше
              log(s"    Error deleting $path: ${e.getMessage}")
          }
        }
      }
    } finally {
      // Закрываем файловую систему для namespace
      fs.close()
    }
  }

  // Подводим итог по удалённым или потенциально удаляемым каталогам
  if (dryRun) {
    log(s"Cleanup simulation completed. Directories marked for deletion: ${plannedPaths.size}.")
    if (plannedPaths.nonEmpty) {
      log("Directories that would be deleted:")
      plannedPaths.foreach(path => log(s"  - $path"))
    }
  } else {
    log(s"Cleanup completed. Successfully deleted ${deletedPaths.size} directories.")
    if (deletedPaths.nonEmpty) {
      log("Deleted directories:")
      deletedPaths.foreach(path => log(s"  - $path"))
    }
  }
} catch {
  case NonFatal(e) =>
    // Логируем и выводим стек при неожиданной ошибке
    log(s"Unexpected error: ${e.getMessage}")
    e.printStackTrace()
} finally {
  // Закрываем лог и явно завершаем приложение
  if (logWriter != null) {
    logWriter.close()
  }
  System.exit(0)
}

