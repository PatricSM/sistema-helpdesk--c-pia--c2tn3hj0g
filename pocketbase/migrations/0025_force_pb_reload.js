migrate(
  (app) => {
    app.logger().info('force_pb_reload migration applied')
  },
  (app) => {
    // no-op
  },
)
