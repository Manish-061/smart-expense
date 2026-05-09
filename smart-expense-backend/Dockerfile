# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# We also need to copy the tessdata folder so the container has the OCR language files
COPY tessdata ./tessdata
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Install Tesseract OCR native libraries for Linux
RUN apt-get update && apt-get install -y tesseract-ocr libtesseract-dev && rm -rf /var/lib/apt/lists/*

# Copy the built jar and tessdata from the build stage
COPY --from=build /app/target/smart-expense-backend-0.0.1-SNAPSHOT.jar app.jar
COPY --from=build /app/tessdata ./tessdata

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
