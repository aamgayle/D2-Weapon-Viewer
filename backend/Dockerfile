FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum* ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -o server ./cmd/server

# Runtime stage
FROM alpine:3.19

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates

# Copy binary from builder
COPY --from=builder /app/server .

# Create cache directory
RUN mkdir -p /app/cache

# Set environment variables
ENV CACHE_DIR=/app/cache
ENV PORT=8080

EXPOSE 8080

CMD ["./server"]
