export interface QueueStats {
  hoursOn: number;       // Загальна кількість годин зі світлом за добу (напр., 16.5)
  hoursOff: number;      // Загальна кількість годин без світла за добу (напр., 7.5)
}

export interface ArchivedDay {
  date: string;              // Унікальний ключ у форматі YYYY-MM-DD (Primary Key)
  queues: Record<string, string>; // Зв'язка: "підчерга" (від "1.1" до "6.2") -> 48-символьний бітовий рядок (напр., "1111000011...")
  meta: {
    savedAt: string;         // ISO Timestamp збереження в БД
    source: 'parser' | 'manual' | 'ocr'; // Джерело даних
    stats: Record<string, QueueStats>;   // Статистика годин для кожної підчерги ("1.1", "1.2" і т.д.)
  };
}

export type CalendarDayType = 
  | 'active-selected'       // Обраний день
  | 'active-has-data'       // Історичний день, що має дані про відключення
  | 'active-no-data'        // Історичний день без відключень (стабільна мережа)
  | 'transit-recent'        // Динамічний день (Вчора/Сьогодні)
  | 'future';               // Майбутня дата (заблоковано)

export interface OutageInterval {
  start: string;            // Початок інтервалу (напр., "04:00")
  end: string;              // Кінець інтервалу (напр., "08:00")
  type: 'outage';           // Завжди outage для відбивок знеструмлень
}
