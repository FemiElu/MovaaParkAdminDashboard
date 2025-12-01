/**
 * Comprehensive list of standardized Nigerian city names
 * Organized alphabetically for easy maintenance
 * Includes major cities from all 36 states + FCT
 */

export const NIGERIAN_CITIES = [
    // A
    "Aba",
    "Abakaliki",
    "Abeokuta",
    "Abuja",
    "Adani",
    "Agbor",
    "Afikpo",
    "Akure",
    "Asaba",
    "Awka",

    // B
    "Bauchi",
    "Benin City",
    "Birnin Kebbi",
    "Bida",
    "Bonny",
    "Buguma",

    // C
    "Calabar",

    // D
    "Damaturu",
    "Dutse",

    // E
    "Ede",
    "Effurun",
    "Ejigbo",
    "Ekpoma",
    "Enugu",

    // F
    "Funtua",

    // G
    "Gboko",
    "Gombe",
    "Gusau",
    "Gwagwalada",

    // H
    "Hadejia",

    // I
    "Ibadan",
    "Igboho",
    "Ijebu-Ode",
    "Ikeja",
    "Ikere-Ekiti",
    "Ikirun",
    "Ikot Ekpene",
    "Ikorodu",
    "Ikot Abasi",
    "Ila Orangun",
    "Ile-Ife",
    "Ilesha",
    "Illela",
    "Ilorin",
    "Inisa",
    "Iwo",
    "Iseyin",

    // J
    "Jalingo",
    "Jimeta",
    "Jos",

    // K
    "Kabba",
    "Kaduna",
    "Kafanchan",
    "Kano",
    "Katsina",
    "Kaura Namoda",
    "Keffi",
    "Kontagora",
    "Kuje",

    // L
    "Lafia",
    "Lagos",
    "Lapai",
    "Lokoja",

    // M
    "Maiduguri",
    "Makurdi",
    "Minna",
    "Mubi",

    // N
    "Nguru",
    "Nnewi",
    "Nsukka",

    // O
    "Oba",
    "Obudu",
    "Offa",
    "Ogaminana",
    "Ogbomosho",
    "Ogoja",
    "Okene",
    "Okigwe",
    "Okitipupa",
    "Ondo",
    "Onitsha",
    "Oran",
    "Osogbo",
    "Ota",
    "Otukpo",
    "Oturkpo",
    "Owerri",
    "Oyo",
    "Ozubulu",

    // P
    "Pankshin",
    "Port Harcourt",
    "Potiskum",

    // S
    "Sagamu",
    "Sapele",
    "Shagamu",
    "Sokoto",
    "Suleja",

    // T
    "Tegina",

    // U
    "Ugep",
    "Uromi",
    "Ughelli",
    "Umuahia",
    "Uyo",

    // W
    "Warri",
    "Wukari",

    // Y
    "Yenagoa",
    "Yola",

    // Z
    "Zaria",
    "Zungeru",
] as const;

export type NigerianCity = typeof NIGERIAN_CITIES[number];

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to detect misspellings
 */
export function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1, // deletion
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[len1][len2];
}

/**
 * Search for cities matching the query with fuzzy matching
 * Returns cities sorted by relevance (exact matches first, then by similarity)
 */
export function searchCities(query: string, maxResults = 10): string[] {
    if (!query || query.trim().length === 0) {
        return [];
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Exact prefix matches (highest priority)
    const exactMatches = NIGERIAN_CITIES.filter((city) =>
        city.toLowerCase().startsWith(normalizedQuery)
    );

    // Fuzzy matches (for typos)
    const fuzzyMatches = NIGERIAN_CITIES
        .filter((city) => !exactMatches.includes(city))
        .map((city) => ({
            city,
            distance: levenshteinDistance(normalizedQuery, city.toLowerCase()),
            containsQuery: city.toLowerCase().includes(normalizedQuery),
        }))
        .filter((match) => {
            // Include if query is contained in city name OR distance is reasonable
            const maxDistance = Math.max(2, Math.floor(normalizedQuery.length * 0.4));
            return match.containsQuery || match.distance <= maxDistance;
        })
        .sort((a, b) => {
            // Prioritize contains over distance
            if (a.containsQuery && !b.containsQuery) return -1;
            if (!a.containsQuery && b.containsQuery) return 1;
            // Then sort by distance
            return a.distance - b.distance;
        })
        .map((match) => match.city);

    // Combine and limit results
    return [...exactMatches, ...fuzzyMatches].slice(0, maxResults);
}
