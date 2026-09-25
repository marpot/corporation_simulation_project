{{- define "corporation-simulation.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "corporation-simulation.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "corporation-simulation.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "corporation-simulation.labels" -}}
app.kubernetes.io/name: {{ include "corporation-simulation.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end -}}
