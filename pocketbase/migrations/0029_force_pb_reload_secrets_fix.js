migrate(
  (app) => {
    // No-op: força o PB a aplicar uma nova migration, o que recycla
    // o processo e faz o JSVM relê os hooks atualizados (lib_email.js
    // e tickets.js usando $secrets.get() para ler RESEND_API_KEY).
  },
  (app) => {
    // No-op: nada para reverter.
  },
)
