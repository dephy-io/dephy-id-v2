import { PositionManager } from "~/components/dodp-tools/dodp-tools-ui"

export default function DodpTools() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">DODP Tools</h1>

      <PositionManager />
    </div>
  )
}
