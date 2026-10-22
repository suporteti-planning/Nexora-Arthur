# Estágio 1: Build do Java com Maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# 1. Copiar apenas o pom.xml primeiro (para aproveitar cache)
COPY pom.xml .

# 2. Baixar todas as dependências (isso vai usar cache)
RUN mvn dependency:go-offline -B

# 3. Copiar o código fonte
COPY src ./src

# 4. Compilar e empacotar
RUN mvn clean package -DskipTests

# Estágio 2: Execução do Jar
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Djava.net.preferIPv4Stack=true", "-jar", "app.jar"]