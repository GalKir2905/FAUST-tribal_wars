import time
from math import floor
from threading import Event
from pynput import mouse, keyboard

# Параметры по умолчанию (можете поменять ниже или в интерактивных вопросах)
DEFAULT_INTERVAL_SECONDS = 3600   # повторять каждые 3600 секунд (1 час)
DEFAULT_TOTAL_HOURS = 10          # всего 10 часов
ASK_INTERACTIVE = True            # если True — спросит параметры после записи

# Состояния и накопители
recording_events = []  # элементы: (t, kind, payload)
recording_started_at = None
stop_recording_event = Event()
abort_replay_event = Event()

mouse_controller = mouse.Controller()

def on_move(x, y):
    if recording_started_at is None:
        return
    t = time.perf_counter() - recording_started_at
    recording_events.append((t, 'move', (x, y)))

def on_click(x, y, button, pressed):
    if recording_started_at is None:
        return
    t = time.perf_counter() - recording_started_at
    recording_events.append((t, 'click', (x, y, str(button), bool(pressed))))

def on_scroll(x, y, dx, dy):
    if recording_started_at is None:
        return
    t = time.perf_counter() - recording_started_at
    recording_events.append((t, 'scroll', (x, y, dx, dy)))

def on_key_press(key):
    # F9 — остановить запись; ESC — прервать воспроизведение
    try:
        if key == keyboard.Key.f9:
            stop_recording_event.set()
            return False  # остановить слушатель клавиатуры для записи
        if key == keyboard.Key.esc:
            abort_replay_event.set()
            # не останавливаем слушатель совсем — пусть работает фоном
    except Exception:
        pass

def wait_for_f8():
    print("Нажмите F8, чтобы начать запись.")
    def _on_press(key):
        try:
            if key == keyboard.Key.f8:
                return False
        except Exception:
            pass
    listener = keyboard.Listener(on_press=_on_press)
    listener.start()
    listener.join()

def record_sequence():
    global recording_started_at
    recording_events.clear()
    stop_recording_event.clear()
    print("Запись началась. Двигайте мышь и кликайте. Нажмите F9, чтобы закончить запись.")

    recording_started_at = time.perf_counter()

    kb_listener = keyboard.Listener(on_press=on_key_press)
    ms_listener = mouse.Listener(on_move=on_move, on_click=on_click, on_scroll=on_scroll)

    kb_listener.start()
    ms_listener.start()

    stop_recording_event.wait()
    # Остановим слушатели
    ms_listener.stop()
    kb_listener.stop()
    ms_listener.join()
    kb_listener.join()

    duration = 0.0
    if recording_events:
        duration = recording_events[-1][0]
    print(f"Запись завершена. Событий: {len(recording_events)}; длительность: {duration:.2f} сек.")
    return duration

def replay_once():
    if not recording_events:
        print("Нет событий для воспроизведения.")
        return

    start = time.perf_counter()
    for t, kind, payload in recording_events:
        if abort_replay_event.is_set():
            print("Воспроизведение прервано (ESC).")
            return
        # Ждём до времени события относительно начала воспроизведения
        wait = start + t - time.perf_counter()
        if wait > 0:
            time.sleep(wait)

        if kind == 'move':
            x, y = payload
            mouse_controller.position = (x, y)
        elif kind == 'click':
            x, y, button_str, pressed = payload
            # Приведём строку 'Button.left' к объекту кнопки
            btn = mouse.Button.left
            if 'right' in button_str:
                btn = mouse.Button.right
            elif 'middle' in button_str:
                btn = mouse.Button.middle
            mouse_controller.position = (x, y)
            if pressed:
                mouse_controller.press(btn)
            else:
                mouse_controller.release(btn)
        elif kind == 'scroll':
            x, y, dx, dy = payload
            mouse_controller.position = (x, y)
            mouse_controller.scroll(dx, dy)

def schedule_replays(interval_seconds, total_seconds=None, repeats=None):
    if repeats is None:
        if total_seconds is None:
            raise ValueError("Нужно указать либо repeats, либо total_seconds.")
        repeats = max(1, floor(total_seconds / interval_seconds))

    print(f"Старт воспроизведения: каждые {interval_seconds} сек, повторов: {repeats}.")
    base = time.time()
    # Фоновый слушатель клавиатуры, чтобы ESC мог прервать в любой момент
    kb_listener = keyboard.Listener(on_press=on_key_press)
    kb_listener.start()

    try:
        for i in range(repeats):
            if abort_replay_event.is_set():
                print("Прервано (ESC).")
                break
            next_run_at = base + (i * interval_seconds)
            sleep_s = next_run_at - time.time()
            if sleep_s > 0:
                time.sleep(sleep_s)
            print(f"[{i+1}/{repeats}] Воспроизведение...")
            replay_once()
        print("Готово.")
    finally:
        kb_listener.stop()
        kb_listener.join()

def ask_params(default_interval=DEFAULT_INTERVAL_SECONDS, default_hours=DEFAULT_TOTAL_HOURS):
    try:
        raw_interval = input(f"Интервал между повторами, сек (по умолчанию {default_interval}): ").strip()
        interval_seconds = int(raw_interval) if raw_interval else default_interval

        mode = input("Указать всего часов (H) или точное число повторов (R)? [H/R, по умолчанию H]: ").strip().lower()
        if mode == 'r':
            raw_repeats = input("Сколько повторов?: ").strip()
            repeats = int(raw_repeats)
            return interval_seconds, None, repeats
        else:
            raw_hours = input(f"Всего часов (по умолчанию {default_hours}): ").strip()
            total_hours = float(raw_hours) if raw_hours else default_hours
            total_seconds = int(total_hours * 3600)
            return interval_seconds, total_seconds, None
    except Exception:
        print("Введены некорректные значения. Использую значения по умолчанию.")
        return default_interval, int(default_hours * 3600), None

def main():
    wait_for_f8()
    seq_duration = record_sequence()
    if seq_duration <= 0:
        print("Похоже, вы ничего не записали. Завершение.")
        return

    if ASK_INTERACTIVE:
        interval_seconds, total_seconds, repeats = ask_params()
    else:
        interval_seconds = DEFAULT_INTERVAL_SECONDS
        total_seconds = int(DEFAULT_TOTAL_HOURS * 3600)
        repeats = None

    # Небольшая подсказка о длительности макроса
    print(f"Длительность записанной последовательности: ~{seq_duration:.2f} сек.")
    schedule_replays(interval_seconds, total_seconds=total_seconds, repeats=repeats)

if __name__ == "__main__":
    print("Подсказки:")
    print("- Перед началом записи нажмите F8.")
    print("- Нажмите F9, чтобы закончить запись.")
    print("- Во время воспроизведения нажмите ESC, чтобы прервать.")
    main()