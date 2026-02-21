import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface AnalysisCardProps {
  title: string;
  items: { name: string; reason: string }[];
}

export function AnalysisCard({ title, items }: AnalysisCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">{item.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
