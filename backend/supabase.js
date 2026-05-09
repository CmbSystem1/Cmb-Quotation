require("dotenv").config();

console.log("SUPABASE URL:");
console.log(process.env.SUPABASE_URL);

const { createClient } =
  require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = supabase;