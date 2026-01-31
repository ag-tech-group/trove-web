import { Link } from "@tanstack/react-router"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function NotFound() {
  return (
    <AppLayout className="flex items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardDescription className="font-medium tracking-widest uppercase">
            Page not found
          </CardDescription>
          <CardTitle className="text-primary text-7xl font-bold tracking-tight">
            404
          </CardTitle>
          <CardDescription className="text-base">
            Sorry, we couldn't find the page you're looking for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/">Go back home</Link>
          </Button>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
