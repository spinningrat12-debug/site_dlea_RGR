// server.js
const express = require('express');
const path = require('path');
// Импорт клиента MongoDB
const { MongoClient } = require('mongodb'); 

const app = express();
const PORT = 3000;

// --- НАСТРОЙКИ MONGODB ---
// URL подключения (предполагаем, что MongoDB запущен локально)
const uri = process.env.MONGO_URI; 
const client = new MongoClient(uri);
// Название вашей базы данных (вы можете его изменить)
const dbName = 'admin'; 

let db;

// --- ПОДКЛЮЧЕНИЕ К MONGODB ---
async function connectToMongo() {
    try {
        await client.connect();
        console.log("✅ Успешное подключение к MongoDB!");
        db = client.db(dbName);
    } catch (e) {
        console.error("❌ Не удалось подключиться к MongoDB:", e);
    }
}
connectToMongo();

// --- MIDDLEWARE (Обработка данных формы) ---
// Позволяет Express разбирать URL-кодированные тела (данные, отправленные из HTML-формы)
app.use(express.urlencoded({ extended: true }));
// Также позволяет разбирать JSON-запросы
app.use(express.json());

// --- МАРШРУТЫ ---

// Обслуживание всех статических файлов (HTML, CSS, JS, изображения)
app.use(express.static(path.join(__dirname, '')));

// GET (Главная страница)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'abobs.html'));
});

// POST МАРШРУТ для бронирования
app.post('/submit-booking', async (req, res) => {
    if (!db) {
        // Отправляем ошибку 500, если база данных не подключена
        return res.status(500).send("База данных не подключена. Попробуйте позже.");
    }

    try {
        const orderData = {
            // Данные берутся из полей формы (req.body)
            user_name: req.body['client-name'],
            phone_number: req.body['phone-number'],
            preferred_car: req.body['car-name'],
            // Преобразуем строку даты в объект Date для MongoDB
            desired_delivery_date: new Date(req.body['rental-date']), 
            order_date: new Date(),
            status: "New" 
        };

        // Вставляем документ в коллекцию 'orders_data'
        const result = await db.collection('users_data').insertOne(orderData);
        console.log(`Новый заказ вставлен с ID: ${result.insertedId}`);

        // ПЕРЕНАПРАВЛЕНИЕ: Перекидываем пользователя на главную страницу
        res.redirect('/');
        
    } catch (error) {
        console.error("Ошибка при вставке заказа:", error);
        // В случае ошибки возвращаем на главную с параметром ошибки
        res.redirect('/?status=error&message=db_error'); 
    }
});


// --- ЗАПУСК СЕРВЕРА ---
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен! Доступен по адресу: http://localhost:${PORT}`);
    console.log(`Для остановки сервера нажмите Ctrl+C`);

});
