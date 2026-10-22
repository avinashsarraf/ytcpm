/** YouTube video category IDs (documented, stable reference values). */
export const VIDEO_CATEGORIES: Record<string, string> = {
  "1": "Film & Animation", "2": "Autos & Vehicles", "3": "Music", "4": "Pets & Animals",
  "5": "Sports", "6": "Short Movies", "7": "Travel & Events", "8": "Gaming",
  "9": "Howto & Style", "10": "Education", "11": "News & Politics", "12": "People & Blogs",
  "13": "Comedy", "14": "Entertainment", "15": "Movies", "16": "Documentary",
  "17": "Science & Technology", "18": "Nonprofits & Activism", "19": "Health & Fitness",
  "20": "History", "21": "Hobby & Leisure", "22": "Kids & Family", "23": "Travel",
  "24": "Society & Culture", "25": "Science", "26": "Education", "27": "Health",
  "28": "News", "29": "Nonprofits & Activism", "30": "Movies", "31": "Anime/Animation",
  "32": "Action/Adventure", "33": "Classics", "34": "Comedy", "35": "Documentary",
  "36": "Drama", "37": "Family", "38": "Foreign", "39": "Horror", "40": "Sci-Fi/Fantasy",
  "41": "Thriller", "42": "Shorts", "43": "Shows", "44": "Trailers",
};
export function categoryName(id: string): string {
  return VIDEO_CATEGORIES[id] ?? (id ? `Category ${id}` : "Uncategorised");
}
