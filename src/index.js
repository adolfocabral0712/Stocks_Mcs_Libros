const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "X-Content-Type-Options": "nosniff",
};

function jsonError(message, status) {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: JSON_HEADERS,
    },
  );
}

async function obtenerStock(env) {
  if (!env.STOCK_JSON_URL) {
    return jsonError(
      "El secret STOCK_JSON_URL no está configurado.",
      500,
    );
  }

  try {
    const respuesta = await fetch(
      env.STOCK_JSON_URL,
      {
        headers: {
          Accept: "application/json",
        },
        redirect: "follow",
        cf: {
          cacheTtl: 0,
          cacheEverything: false,
        },
      },
    );

    if (!respuesta.ok) {
      return jsonError(
        `No se pudo obtener el JSON de stock. HTTP ${respuesta.status}.`,
        502,
      );
    }

    const contenido = await respuesta.text();

    try {
      JSON.parse(contenido);
    } catch {
      return jsonError(
        "El origen no devolvió un JSON válido.",
        502,
      );
    }

    return new Response(contenido, {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    console.error(
      "Error consultando el JSON de stock:",
      error,
    );

    return jsonError(
      "No fue posible consultar los datos de stock.",
      502,
    );
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/stock") {
      if (
        request.method !== "GET" &&
        request.method !== "HEAD"
      ) {
        return new Response(
          "Método no permitido",
          {
            status: 405,
            headers: {
              Allow: "GET, HEAD",
            },
          },
        );
      }

      const respuesta =
        await obtenerStock(env);

      if (request.method === "HEAD") {
        return new Response(null, {
          status: respuesta.status,
          headers: respuesta.headers,
        });
      }

      return respuesta;
    }

    if (url.pathname.startsWith("/api/")) {
      return jsonError(
        "Ruta de API no encontrada.",
        404,
      );
    }

    return env.ASSETS.fetch(request);
  },
};
