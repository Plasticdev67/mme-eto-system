import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import { prettifyEnum, getProjectStatusColor, getSalesStageColor } from "@/lib/utils"

async function getCustomer(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { isPrimary: "desc" } },
      projects: {
        orderBy: { updatedAt: "desc" },
        include: {
          coordinator: { select: { name: true } },
          _count: { select: { products: true } },
        },
      },
    },
  })
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/customers" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{customer.name}</h1>
          <Badge variant="secondary">{prettifyEnum(customer.customerType)}</Badge>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {customer.email && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm">{customer.email}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {customer.phone && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm">{customer.phone}</p>
              </div>
            </CardContent>
          </Card>
        )}
        {customer.paymentTerms && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Payment Terms</p>
                <p className="text-sm">{customer.paymentTerms}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Projects for this customer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projects ({customer.projects.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-border bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Coordinator</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">Products</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customer.projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-sm font-medium text-blue-600">
                      <Link href={`/projects/${project.id}`}>{project.projectNumber}</Link>
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/projects/${project.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant="secondary" className={getProjectStatusColor(project.projectStatus)}>
                        {prettifyEnum(project.projectStatus)}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant="secondary" className={getSalesStageColor(project.salesStage)}>
                        {prettifyEnum(project.salesStage)}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{project.coordinator?.name || "—"}</td>
                    <td className="px-6 py-3 text-center font-mono">{project._count.products}</td>
                  </tr>
                ))}
                {customer.projects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No projects for this customer.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
