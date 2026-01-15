
export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  health_benefits: string[];
  harmful_warnings: string[];
  nova_score: number; // 1-4 NOVA scale for processing
  is_ultra_processed: boolean;
  motivation: string; // Motivational message for the user
  scanned_image?: string; // Base64 of the image scanned
  verdict: string; // e.g., "Superfood", "Healthy Choice", "Moderate", "Occasional Treat", "Avoid"
  health_score: number; // 1-100
  key_nutrients: string[]; // e.g., ["High Fiber", "Vitamin C", "Low Sodium"]
  better_alternatives?: string[]; // Suggested better versions if unhealthy
  timestamp?: number; // Unix timestamp of the log
}

export interface UserProfile {
  id: string;
  name: string;
  onboarded: boolean;
  scan_count: number;
  daily_scan_count: number;
  last_scan_date: string;
  is_pro: boolean;
  dietary_preference: string;
  activity_level: string;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water_ml: number;
    primary_objective: string;
  };
  stats: {
    weight: number;
    height: number;
    age: number;
  };
}

export interface Post {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  image_url: string;
  caption: string;
  likes: number;
  timestamp: string;
  nutrition_summary?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    verdict: string;
  };
}

export interface Meal {
  time: string;
  title: string;
  description: string;
  calories: number;
  macros: {
    p: number;
    c: number;
    f: number;
  };
}

export interface MealPlan {
  meals: Meal[];
  daily_tip: string;
}

export interface GroceryCategory {
  category: string;
  items: string[];
}

export interface Restaurant {
  name: string;
  uri: string;
  snippet?: string;
  rating?: string;
}

export interface WorkoutExercise {
  name: string;
  duration: string;
  instructions: string;
  target_calories: number;
}

export interface WorkoutPlan {
  title: string;
  type: string;
  total_duration: string;
  exercises: WorkoutExercise[];
}

export interface ProgressReview {
  summary: string;
  changes: string[];
  encouragement: string;
}

export interface PantryReport {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  items_found: string[];
  top_recommendations: string[];
  suggested_recipe: {
    name: string;
    ingredients: string[];
  };
}

export interface SleepData {
  hours: number;
  quality: number; // 1-10
  stress_level: number; // 1-10
}

export interface RecoveryProtocol {
  readiness_score: number;
  activity_recommendation: string;
  nutrition_focus: string;
  supplement_tips: string[];
}

export interface Substitution {
  original: string;
  replacement: string;
  benefits: string;
  macros_diff: string;
}
