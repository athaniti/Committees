import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve((_req) => {
  console.log('Test function called')
  
  return new Response(
    JSON.stringify({ 
      message: "Test endpoint working!", 
      timestamp: new Date().toISOString() 
    }),
    {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*"
      },
    },
  )
})