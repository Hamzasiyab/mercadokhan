const https = require('https');
const http = require('http');

exports.handler = async function(event, context) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { xmlPayload } = JSON.parse(event.body);

    if (!xmlPayload) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'xmlPayload requerido' })
      };
    }

    // Endpoint del ambiente piloto de ZOFRI
    const ZOFRI_URL = 'http://sve-piloto.zofri.cl/sveProcDocWSN/ProcesarDocumento';
    const url = new URL(ZOFRI_URL);

    const xmlBuffer = Buffer.from(xmlPayload, 'utf8');

    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'ProcesarDocumento',
        'Authorization': 'Basic ' + Buffer.from('nvidal:nvidal123').toString('base64'),
        'Content-Length': xmlBuffer.length
      }
    };

    return await new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              success: true,
              zofriResponse: data,
              statusCode: res.statusCode
            })
          });
        });
      });

      req.on('error', (e) => {
        resolve({
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            success: false,
            error: e.message
          })
        });
      });

      req.write(xmlBuffer);
      req.end();
    });

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
