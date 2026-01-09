
import { GoogleGenAI, Type } from "@google/genai";
import { DailySchedule, PrayerName } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const searchLocations = async (query: string): Promise<string[]> => {
  if (query.length < 3) return [];

  const prompt = `Cari 5 lokasi yang relevan untuk query: "${query}". 
  Format setiap lokasi harus sangat mendetail: "Negara, Provinsi, Kota/Kabupaten, Kecamatan, Desa/Dusun/Kelurahan" (jika data tersedia).
  Berikan hasil hanya dalam bentuk list string, satu baris untuk satu lokasi. 
  Pastikan lokasinya nyata dan akurat di Indonesia atau wilayah terkait.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    // Clean up lines and filter empty ones
    const locations = text.split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 5 && line.includes(','));
    
    return locations;
  } catch (error) {
    console.error("Search Location Error:", error);
    return [];
  }
};

export const fetchPrayerTimes = async (location: { lat: number; lng: number } | { address: string }): Promise<DailySchedule> => {
  const today = new Date().toISOString().split('T')[0];
  let locationQuery = '';
  
  if ('address' in location) {
    locationQuery = `location "${location.address}"`;
  } else {
    locationQuery = `coordinates Latitude: ${location.lat}, Longitude: ${location.lng}`;
  }

  const prompt = `Get the highly accurate Islamic prayer times for today (${today}) for ${locationQuery}. 
  I MUST have exactly these 5 prayer times: Subuh, Dzuhur, Ashar, Maghrib, and Isya. 
  Format your response as a simple list like this:
  Subuh: HH:mm
  Dzuhur: HH:mm
  Ashar: HH:mm
  Maghrib: HH:mm
  Isya: HH:mm
  
  Replace HH:mm with the 24-hour time. Provide ONLY this list and the name of the location at the top. 
  If you are using Google Search results that use names like Fajr, Dhuhr, Asr, or Isha, map them to Subuh, Dzuhur, Ashar, and Isya respectively.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    // Extract grounding sources
    const sources: { title: string; uri: string }[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }
    
    // Robust mapping with variations
    const prayerNamesMapping: Record<string, PrayerName> = {
      'subuh': 'Subuh', 'fajr': 'Subuh', 'shubuh': 'Subuh',
      'dzuhur': 'Dzuhur', 'dhuhr': 'Dzuhur', 'zhuhr': 'Dzuhur', 'zuhur': 'Dzuhur',
      'ashar': 'Ashar', 'asr': 'Ashar',
      'maghrib': 'Maghrib',
      'isya': 'Isya', 'isha': 'Isya'
    };

    const prayersFoundMap: Map<PrayerName, string> = new Map();
    const lines = text.split('\n');
    
    // More flexible regex to catch various formats
    const timeRegex = /(\d{1,2}[:.]\d{2})/g;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const timesInLine = line.match(timeRegex);
      
      if (timesInLine) {
        // Find which prayer name is mentioned in this line
        for (const [key, val] of Object.entries(prayerNamesMapping)) {
          if (lowerLine.includes(key)) {
            // Clean the time format to HH:mm
            const cleanTime = timesInLine[0].replace('.', ':').padStart(5, '0');
            if (!prayersFoundMap.has(val)) {
              prayersFoundMap.set(val, cleanTime);
            }
          }
        }
      }
    }

    let detectedLocation = 'Lokasi Kustom';
    if ('address' in location) {
      detectedLocation = location.address;
    } else {
      const cityMatch = text.match(/(?:di|in|kota|city|region|location)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      if (cityMatch) detectedLocation = cityMatch[1];
    }

    const order: PrayerName[] = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
    const finalPrayers = order.map(name => {
      const time = prayersFoundMap.get(name);
      if (!time) throw new Error(`Waktu untuk ${name} tidak ditemukan dalam respon.`);
      return { name, time };
    });

    return {
      date: today,
      location: detectedLocation,
      prayers: finalPrayers,
      sources: sources.length > 0 ? sources : undefined
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
