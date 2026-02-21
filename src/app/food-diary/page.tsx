import { Accordion } from "~/components/ui/accordion";
import { MealAccordion } from "~/components/food-diary/meal-accordion";
import { getTodayFoodEntries } from "~/server/actions/food-diary";

const MEAL_TYPES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Supper",
  "Party",
] as const;

export default async function FoodDiaryPage() {
  const entries = await getTodayFoodEntries();

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-4 pb-20">
      <p className="mb-4 font-medium">{dateStr}</p>
      <Accordion type="multiple">
        {MEAL_TYPES.map((meal) => {
          const entry =
            entries.find((e) => e.mealType === meal) ?? null;
          return <MealAccordion key={meal} mealType={meal} entry={entry} />;
        })}
      </Accordion>
    </div>
  );
}
