import EditRoomTypeForm from "../../_components/EditRoomTypeForm";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditRoomTypePage({ params }: PageProps) {
    const resolvedParams = await params;
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Edit Room Type</h1>
                <p className="text-gray-600 text-sm mt-2">Update room type details</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <EditRoomTypeForm roomTypeId={resolvedParams.id} />
            </div>
        </div>
    );
}