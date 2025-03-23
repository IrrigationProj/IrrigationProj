import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("PROJECT_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch last 10 moisture readings
  const { data, error } = await supabase
    .from("Moisture Measurement")
    .select("Sensor_1, Sensor_2")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Define moisture threshold
  const threshold = 2000;

  // Determine pump statuses
  const pump1Status = data.every(row => row.Sensor_1 < threshold) ? "off" : "on";
  const pump2Status = data.every(row => row.Sensor_2 < threshold) ? "off" : "on";

  // Insert new pump status record
  const { error: insertError } = await supabase.from("Pump status").insert([
    {
      Pump_1: pump1Status,
      Pump_2: pump2Status
    }
  ]);

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ 
      "Pump_1": pump1Status, 
      "Pump_2": pump2Status 
    }), 
    { status: 200 }
  );
});
