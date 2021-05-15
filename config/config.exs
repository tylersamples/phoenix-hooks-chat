# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :myapp,
  namespace: MyApp

# Configures the endpoint
config :myapp, MyAppWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "YT86a5eOzM0WL31jP3y+VmvX1wplSX2z5PPvJs/csv5rLdoYuCEWnoLEJzErnOgD",
  render_errors: [view: MyAppWeb.ErrorView, accepts: ~w(json), layout: false],
  pubsub_server: MyApp.PubSub,
  live_view: [signing_salt: "Vb5UpQqU"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
