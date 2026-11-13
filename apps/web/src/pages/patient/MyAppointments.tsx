import { CalendarX2, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { CardEmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MyAppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My visits"
        description="Every appointment, with its token and current status."
        actions={
          <Button asChild>
            <Link to="/patient/book">Book a visit</Link>
          </Button>
        }
      />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <CardEmptyState
            icon={Ticket}
            title="No upcoming appointments"
            description="Once you book, your token and live queue position appear here."
            action={
              <Button asChild size="sm">
                <Link to="/patient/book">Book an appointment</Link>
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="past">
          <CardEmptyState
            icon={CalendarX2}
            title="No past visits yet"
            description="Completed consultations will be listed here for your records."
          />
        </TabsContent>

        <TabsContent value="cancelled">
          <CardEmptyState
            icon={CalendarX2}
            title="Nothing cancelled"
            description="Cancelled appointments stay visible here, with the reason if the hospital added one."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
