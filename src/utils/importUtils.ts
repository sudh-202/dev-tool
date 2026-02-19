import { Tool } from "@/types";

// Helper to parse CSV line handling quotes
const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

export const importToolsFromCSV = async (
  file: File,
): Promise<Omit<Tool, "id" | "createdAt" | "updatedAt">[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          reject(new Error("File is empty"));
          return;
        }

        const lines = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line);
        if (lines.length < 2) {
          reject(
            new Error(
              "CSV file must have a header row and at least one data row",
            ),
          );
          return;
        }

        // Expected headers: Name,URL,Description,Category,Categories,Tags,Pinned,Favorite,Notes,Created At,Updated At,Usage Count,Last Used
        // We'll map by index since headers might vary slightly in casing, but order is important based on our export

        const tools: Omit<Tool, "id" | "createdAt" | "updatedAt">[] = [];

        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const columns = parseCSVLine(lines[i]);

          // Basic validation - must have at least Name and URL (first 2 columns)
          if (columns.length < 2) continue;

          const name = columns[0] || "Untitled Tool";
          const url = columns[1] || "";

          if (!name || !url) continue;

          // Field mapping based on exportUtils.ts order:
          // 0: Name, 1: URL, 2: Description, 3: Category, 4: Categories, 5: Tags,
          // 6: Pinned, 7: Favorite, 8: Notes, 9: Created At, 10: Updated At, 11: Usage Count, 12: Last Used

          const description = columns[2] || "";
          const category = columns[3] || "Other";

          // Handle pipe-separated arrays
          let categories: string[] = [];
          if (columns[4]) {
            categories = columns[4]
              .split("|")
              .map((c) => c.trim())
              .filter((c) => c);
          }
          if (categories.length === 0 && category) {
            categories = [category];
          }

          let tags: string[] = [];
          if (columns[5]) {
            tags = columns[5]
              .split("|")
              .map((t) => t.trim())
              .filter((t) => t);
          }

          // Handle booleans
          const isPinned =
            columns[6]?.toLowerCase() === "yes" ||
            columns[6]?.toLowerCase() === "true";
          const isFavorite =
            columns[7]?.toLowerCase() === "yes" ||
            columns[7]?.toLowerCase() === "true";

          const notes = columns[8] || "";

          // Usage count
          const usageCount = columns[11] ? parseInt(columns[11], 10) : 0;

          // Last used
          const lastUsed = columns[12] ? new Date(columns[12]) : undefined;

          tools.push({
            name,
            url,
            description,
            category,
            categories,
            tags,
            isPinned,
            isFavorite,
            notes,
            usageCount: isNaN(usageCount) ? 0 : usageCount,
            lastUsed:
              lastUsed && !isNaN(lastUsed.getTime()) ? lastUsed : undefined,
          });
        }

        resolve(tools);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
};

export const importToolsFromJSON = async (
  file: File,
): Promise<Omit<Tool, "id" | "createdAt" | "updatedAt">[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          reject(new Error("File is empty"));
          return;
        }

        const data = JSON.parse(text);

        if (!Array.isArray(data)) {
          reject(new Error("JSON must be an array of tools"));
          return;
        }

        const tools: Omit<Tool, "id" | "createdAt" | "updatedAt">[] = data
          .map((item: any) => {
            // Validation and sanitization
            return {
              name: item.name || "Untitled",
              url: item.url || "",
              description: item.description || "",
              category: item.category || "Other",
              categories: Array.isArray(item.categories)
                ? item.categories
                : item.category
                  ? [item.category]
                  : ["Other"],
              tags: Array.isArray(item.tags) ? item.tags : [],
              isPinned: !!item.isPinned,
              isFavorite: !!item.isFavorite,
              notes: item.notes || "",
              usageCount:
                typeof item.usageCount === "number" ? item.usageCount : 0,
              lastUsed: item.lastUsed ? new Date(item.lastUsed) : undefined,
              // Optional fields that might be in JSON
              favicon: item.favicon,
              email: item.email,
              apiKey: item.apiKey,
            };
          })
          .filter((t) => t.url); // Ensure URL exists

        resolve(tools);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
};
