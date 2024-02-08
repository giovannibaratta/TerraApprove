FROM alpine:latest

WORKDIR /app

COPY terraapprove-alpine terraapprove
COPY validate-plan.sh validate.sh

CMD ["/bin/ash", "/app/validate.sh"]