
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

export function CommonCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {children}
      </CardContent>
    </Card>
  )
}


export function InputWithLabel({ label, id, ...props }: React.ComponentProps<"input"> & { label: string }) {
  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} placeholder={label} {...props} />
    </>
  )
}
