javascript:(function(){
    // Простейший тест
    const btn = document.createElement('button');
    btn.innerHTML = 'TEST BUTTON';
    btn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;background:red;color:white;padding:10px;';
    btn.onclick = function() {
        alert('Кнопка работает!');
    };
    document.body.appendChild(btn);
    alert('Скрипт выполнен!');
})();