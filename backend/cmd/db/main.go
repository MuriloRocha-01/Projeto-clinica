// Runs an explicitly supplied SQL file or query using the backend environment.
package main

import (
	"agendamento-clinica/backend/internal/database"
	"context"
	"encoding/json"
	"flag"
	"log"
	"os"
	"time"
)

func main() {
	file := flag.String("file", "", "SQL file to apply")
	query := flag.String("query", "", "read-only query to inspect database")
	flag.Parse()
	if (*file == "") == (*query == "") {
		log.Fatal("use exatamente um de -file ou -query")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := database.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()
	if *file != "" {
		sql, err := os.ReadFile(*file)
		if err != nil {
			log.Fatal(err)
		}
		if _, err = pool.Exec(ctx, string(sql)); err != nil {
			log.Fatal(err)
		}
		log.Print("SQL aplicado com sucesso")
		return
	}
	rows, err := pool.Query(ctx, *query)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	result := make([]map[string]any, 0)
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			log.Fatal(err)
		}
		record := make(map[string]any)
		for i, field := range rows.FieldDescriptions() {
			record[field.Name] = values[i]
		}
		result = append(result, record)
	}
	if err := rows.Err(); err != nil {
		log.Fatal(err)
	}
	if err := json.NewEncoder(os.Stdout).Encode(result); err != nil {
		log.Fatal(err)
	}
}
