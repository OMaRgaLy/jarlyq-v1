# syntax=docker/dockerfile:1
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/jarlyq ./cmd/api

FROM gcr.io/distroless/base-debian12
COPY --from=builder /bin/jarlyq /bin/jarlyq
ENV HTTP_PORT=8080
EXPOSE 8080
ENTRYPOINT ["/bin/jarlyq"]
