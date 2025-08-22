import { ShowDevice } from "~/components/dephy-id/dephy-id-ui";
import { useParams } from "react-router"
import { assertIsAddress } from "gill";
import { useDevice, useMplCoreCollection } from "~/components/dephy-id/dephy-id-data-access";

export default function DeviceDetail() {
  const params = useParams() as { device: string }
  assertIsAddress(params.device)
  const device = useDevice({ deviceAsset: params.device })

  if (!device.isFetched) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <ShowDevice device={device.data!} />
    </div>
  )
}
