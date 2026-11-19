FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -q -B dependency:go-offline
COPY src src
RUN ./mvnw -q -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S tempo && adduser -S -G tempo tempo
WORKDIR /app
COPY --from=build /app/target/tempo-*.jar app.jar
USER tempo
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
