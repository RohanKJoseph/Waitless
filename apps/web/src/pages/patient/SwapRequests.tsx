import { Inbox, Repeat2, Send } from "lucide-react";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SwapRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Slot swaps"
        description="Trade appointment times with another patient — only if you both agree."
      />

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">How a swap stays safe</CardTitle>
          <CardDescription>
            One request at a time, same doctor, and a single database transaction when both
            patients accept.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            ["1", "You request", "Pick an eligible slot from the same doctor's queue."],
            ["2", "They accept", "The other patient has 10 minutes to respond."],
            ["3", "Both move", "Tokens and queue positions exchange atomically."],
          ].map(([step, title, body]) => (
            <div key={step} className="rounded-lg bg-background/70 p-3">
              <span className="inline-grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {step}
              </span>
              <p className="mt-2 text-sm font-medium">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming">
            <Inbox className="mr-1.5 size-3.5" />
            Incoming
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            <Send className="mr-1.5 size-3.5" />
            Sent
          </TabsTrigger>
          <TabsTrigger value="history">
            <Repeat2 className="mr-1.5 size-3.5" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <CardEmptyState
            icon={Inbox}
            title="No swap requests"
            description="If another patient asks to trade slots with you, it will appear here with a countdown."
          />
        </TabsContent>

        <TabsContent value="outgoing">
          <CardEmptyState
            icon={Send}
            title="You haven't sent any requests"
            description="Open an upcoming visit to propose a swap. Requests expire after 10 minutes."
          />
        </TabsContent>

        <TabsContent value="history">
          <CardEmptyState
            icon={Repeat2}
            title="No swap history"
            description="Accepted, declined and expired requests are kept here for your reference."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
