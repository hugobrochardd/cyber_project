/**
 * Netlify Function - Statistiques KPI
 * Projet de sensibilisation cybersécurité - Université de Corse
 * 
 * Cette function retourne les KPI agrégés pour l'interface admin
 */

import { neon } from '@netlify/neon';

export default async (request, context) => {
  // Accepter uniquement les requêtes GET
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Initialiser la connexion Neon
    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // 1. Total d'événements par type
    const eventsByType = await sql`
      SELECT event_type, COUNT(*) as count
      FROM kpi_events
      GROUP BY event_type
      ORDER BY count DESC
    `;

    // 2. Nombre de sessions distinctes par type (tunnel de conversion)
    const sessionsByType = await sql`
      SELECT event_type, COUNT(DISTINCT session_id) as sessions
      FROM kpi_events
      GROUP BY event_type
      ORDER BY sessions DESC
    `;

    // 3. Stats quotidiennes (derniers 30 jours)
    const dailyEvents = await sql`
      SELECT 
        DATE(created_at) as date,
        event_type,
        COUNT(*) as count
      FROM kpi_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at), event_type
      ORDER BY date DESC, event_type
    `;

    // 4. Total de sessions uniques
    const totalSessions = await sql`
      SELECT COUNT(*) as total
      FROM kpi_sessions
    `;

    // 5. Détails des clics sur liens de formation (extra.link)
    const trainingClicks = await sql`
      SELECT 
        extra->>'link' as link_name,
        COUNT(*) as clicks
      FROM kpi_events
      WHERE event_type = 'cyber_training_click'
        AND extra IS NOT NULL
        AND extra ? 'link'
      GROUP BY extra->>'link'
      ORDER BY clicks DESC
    `;

    // Construire la réponse
    const stats = {
      eventsByType: eventsByType.map(row => ({
        event_type: row.event_type,
        count: parseInt(row.count, 10)
      })),
      sessionsByType: sessionsByType.map(row => ({
        event_type: row.event_type,
        sessions: parseInt(row.sessions, 10)
      })),
      dailyEvents: dailyEvents.map(row => ({
        date: row.date.toISOString().split('T')[0],
        event_type: row.event_type,
        count: parseInt(row.count, 10)
      })),
      totalSessions: parseInt(totalSessions[0]?.total || 0, 10),
      trainingClicks: trainingClicks.map(row => ({
        link: row.link_name,
        clicks: parseInt(row.clicks, 10)
      }))
    };

    console.log('[KPI Stats] Statistiques générées avec succès');

    return new Response(
      JSON.stringify(stats),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60' // Cache 1 minute
        }
      }
    );

  } catch (error) {
    console.error('[KPI Stats] Erreur lors de la récupération des stats:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
