const { createClient } = require('@supabase/supabase-js');

const supabaseClientes = createClient(
    process.env.SUPABASE_CLIENTES_URL,
    process.env.SUPABASE_CLIENTES_ANON_KEY
);

const supabaseGestao = createClient(
    process.env.SUPABASE_GESTAO_URL,
    process.env.SUPABASE_GESTAO_ANON_KEY
);

module.exports = { supabaseClientes, supabaseGestao };
