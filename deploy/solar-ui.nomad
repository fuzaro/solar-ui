# =============================================================================
# Solar UI — Multi-Portal Web Interface  (Nomad service job)
# Solar System Platform
#
# Deploy:
#   nomad job run deploy/solar-ui.nomad
#
# Service discovery:
#   solar-ui.service.homecl1.consul:3080
# =============================================================================

job "solar-ui" {
  datacenters = ["hmlabcl1"]
  type        = "service"
  namespace   = "default"

  group "ui" {
    count = 1

    restart {
      attempts = 3
      interval = "5m"
      delay    = "15s"
      mode     = "fail"
    }

    network {
      port "http" {
        static = 3080
        to     = 8080
      }
    }

    service {
      name = "solar-ui"
      port = "http"
      tags = ["solar", "ui", "frontend", "web"]

      check {
        type     = "http"
        path     = "/"
        interval = "15s"
        timeout  = "3s"
      }
    }

    task "nginx" {
      driver = "docker"

      config {
        image        = "localhost:5000/solar-ui:1.0.0"
        ports        = ["http"]
      }

      # Vault integration — inject backend URLs as build-time env is baked,
      # but this allows runtime config file generation if needed.
      vault {
        role          = "solar-ui"
        change_mode   = "restart"
        change_signal = "SIGTERM"
      }

      template {
        data = <<EOF
{{ with secret "kv/data/solar/config/venus" }}
PUBLIC_VENUS_URL={{ .Data.data.url }}
{{ end }}
{{ with secret "kv/data/solar/config/saturn" }}
PUBLIC_SATURN_URL={{ .Data.data.url }}
{{ end }}
{{ with secret "kv/data/solar/config/sun" }}
PUBLIC_SUN_URL={{ .Data.data.url }}
{{ end }}
{{ with secret "kv/data/solar/config/moon" }}
PUBLIC_MOON_URL={{ .Data.data.url }}
{{ end }}
{{ with secret "kv/data/solar/config/neptune" }}
PUBLIC_NEPTUNE_URL={{ .Data.data.url }}
{{ end }}
{{ with secret "kv/data/solar/config/pluto" }}
PUBLIC_PLUTO_URL={{ .Data.data.url }}
{{ end }}
{{ with secret "kv/data/solar/config/mars" }}
PUBLIC_MARS_URL={{ .Data.data.url }}
{{ end }}
{{ with secret "kv/data/solar/config/mercury" }}
PUBLIC_MERCURY_URL={{ .Data.data.url }}
{{ end }}
{{ with secret "kv/data/solar/config/themis" }}
PUBLIC_THEMIS_URL={{ .Data.data.url }}
{{ end }}
EOF
        destination = "secrets/env"
        env         = true
      }

      env {
        SOLAR_UI_VERSION = "1.0.0"
        NGINX_PORT       = "3080"
      }

      resources {
        cpu    = 256
        memory = 256
      }

      logs {
        max_files     = 5
        max_file_size = 10
      }
    }
  }
}
