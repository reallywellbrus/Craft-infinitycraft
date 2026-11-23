/* =========================================================
   Настройки Supabase для общего каталога.
   Эти значения видны всем — anon key публичный по задумке Supabase.
   НИКОГДА не вставляйте сюда service_role key.

   1. Создайте проект на supabase.com.
   2. Выполните db/schema.sql в SQL Editor.
   3. Settings → API: скопируйте Project URL и anon public key.
   4. Впишите их ниже и перезагрузите сайт.
   ========================================================= */
window.CRAFT_SUPABASE = {
  url: 'https://fyvszmeziokyvsoxbomv.supabase.co', // без /rest/v1/ в конце
  anonKey: 'sb_publishable_35AqbfLy0Ssj8eo9clvPKw_HlNtGIqi',
};
