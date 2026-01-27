/**
 * Netlify Function - Enregistrement des KPI
 * Projet de sensibilisation cybersécurité - Université de Corse
 * 
 * Cette function enregistre les événements utilisateur dans Neon (Postgres)
 * Tables : kpi_sessions, kpi_events
 */

import { neon } from '@netlify/neon';

export default async (request, context) => {
  // Accepter uniquement les requêtes POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parser le body de la requête
    const body = await request.json();
    const {
      type,           // event_type
      sessionId,      // session_id anonyme
      page,           // page_path
      referrer,       // referrer
      userAgent,      // user_agent
      deviceType,     // device_type
      language,       // language
      extra           // données supplémentaires (JSON)
    } = body;

    // Validation des champs obligatoires
    if (!type || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type and sessionId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialiser la connexion Neon (utilise NETLIFY_DATABASE_URL automatiquement)
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // UPSERT dans kpi_sessions
    // Si la session existe déjà, on met juste à jour last_seen
    // Sinon on crée une nouvelle ligne
    await sql`
      INSERT INTO kpi_sessions (session_id, user_agent, device_type, language, first_seen, last_seen)
      VALUES (
        ${sessionId},
        ${userAgent || null},
        ${deviceType || null},
        ${language || null},
        NOW(),
        NOW()
      )
      ON CONFLICT (session_id)
      DO UPDATE SET last_seen = NOW()
    `;

    // INSERT dans kpi_events
    await sql`
      INSERT INTO kpi_events (session_id, event_type, page_path, referrer, extra, created_at)
      VALUES (
        ${sessionId},
        ${type},
        ${page || null},
        ${referrer || null},
        ${extra ? JSON.stringify(extra) : null}::jsonb,
        NOW()
      )
    `;

    console.log(`[KPI] Événement enregistré: ${type} pour session ${sessionId.substring(0, 8)}...`);

    // Réponse succès
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[KPI] Erreur lors de l\'enregistrement:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
