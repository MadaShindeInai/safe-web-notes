import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { FeelingsForm } from "./feelings-form";
import { FoodEntryForm } from "./food-entry-form";

type Entry = {
  id: string;
  description: string;
  feelings: string | null;
};

type Props = {
  mealType: string;
  entry: Entry | null;
};

export function MealAccordion({ mealType, entry }: Props) {
  return (
    <AccordionItem value={mealType}>
      <AccordionTrigger>{mealType}</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 px-1">
          {!entry ? (
            <FoodEntryForm mealType={mealType} />
          ) : entry.feelings === null ? (
            <>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  What you ate
                </p>
                <p className="text-sm">{entry.description}</p>
              </div>
              <FeelingsForm entryId={entry.id} />
            </>
          ) : (
            <>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  What you ate
                </p>
                <p className="text-sm">{entry.description}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  How you felt
                </p>
                <p className="text-sm">{entry.feelings}</p>
              </div>
            </>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
