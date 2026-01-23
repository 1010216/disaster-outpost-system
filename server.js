// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.static("public"));
const PORT = 3000;

// === 模擬水位測站資料 ===
const stations = [
  { name: "淡水河", lat: 25.17, lng: 121.44, level: 2.3, alert: 3 },
  { name: "基隆河", lat: 25.13, lng: 121.73, level: 1.8, alert: 2.5 },
  { name: "大漢溪", lat: 24.95, lng: 121.35, level: 1.2, alert: 2.0 }
];

// === 氣象資料 ===
app.get("/api/weather", async (req, res) => {
  const city = req.query.city || "新北市"; // 預設新北市

  try {
    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${process.env.CWB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`氣象署 API 回傳錯誤狀態碼：${response.status}`);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("氣象署 API 回傳非 JSON：" + text.slice(0, 200));
    }

    // 找出指定城市
    const location = data.records?.location?.find(loc => loc.locationName.includes(city));
    if (!location) throw new Error(`找不到城市：${city}`);

    const elements = location.weatherElement || [];
    const weather = {
      locationName: location.locationName,
      weather: elements[0]?.time?.[0]?.parameter?.parameterName || "晴",
      minT: elements[2]?.time?.[0]?.parameter?.parameterName || "25",
      maxT: elements[4]?.time?.[0]?.parameter?.parameterName || "31"
    };

    res.json(weather);
  } catch (err) {
    console.error("❌ 氣象資料讀取失敗：", err.message);
    res.json({ 
      locationName: city, 
      weather: "晴", 
      minT: "25", 
      maxT: "31",
      error: err.message
    });
  }
});

// === 河川水位資料 ===
app.get("/api/waterlevel", async (req, res) => {
  const station = req.query.station || "板橋"; // 預設測站（可自行改）

  try {
    const url = "https://fhy.wra.gov.tw/WraApi/v1/Water/RealTimeWaterLevel";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`水利署 API 回傳錯誤狀態碼：${response.status}`);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("水利署 API 回傳非 JSON：" + text.slice(0, 200));
    }

    const records = data?.Data;
    if (!Array.isArray(records)) {
      throw new Error("水位資料格式不正確");
    }

    // 找出指定測站
    const target = records.find(item =>
      item.StationName?.includes(station)
    );

    if (!target) {
      throw new Error(`找不到測站：${station}`);
    }

    const waterLevelData = {
      stationName: target.StationName,
      river: target.RiverName,
      waterLevel: target.WaterLevel, // 單位：公尺
      time: target.RecordTime
    };

    res.json(waterLevelData);

  } catch (err) {
    console.error("❌ 河川水位資料讀取失敗：", err.message);
    res.json({
      stationName: station,
      river: "未知",
      waterLevel: "0.00",
      time: null,
      error: err.message
    });
  }
});



// === 地震資料 ===
app.get("/api/earthquake", async (req, res) => {
  try {
    const url = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001?Authorization=" + process.env.CWB_API_KEY;
    const response = await fetch(url);
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("地震資料非 JSON：" + text.slice(0, 100));
    }

    const eq = data.records?.Earthquake?.[0];
    const info = {
      time: eq?.EarthquakeInfo?.OriginTime || "無資料",
      location: eq?.EarthquakeInfo?.Epicenter?.Location || "無資料",
      magnitude: eq?.EarthquakeInfo?.EarthquakeMagnitude?.MagnitudeValue || "無資料"
    };
    res.json(info);
  } catch (err) {
    console.error("❌ 地震資料讀取失敗：", err.message);
    //res.json({ time: "2025-10-12", location: "台灣東部外海", magnitude: "4.8" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 智慧災害系統伺服器啟動：http://localhost:${PORT}`);
});




