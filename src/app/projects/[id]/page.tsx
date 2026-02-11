import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Package,
  Edit,
} from "lucide-react"
import Link from "next/link"
import {
  formatDate,
  getProjectStatusColor,
  getSalesStageColor,
  getDepartmentColor,
  getProductionStageColor,
  prettifyEnum,
  calculateScheduleRag,
  getRagColor,
  getRagTextColor,
} from "@/lib/utils"
import { ProductStatusActions } from "@/components/projects/product-status-actions"
import { AddProductDialog } from "@/components/projects/add-product-dialog"

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      coordinator: true,
      products: {
        include: {
          designer: { select: { name: true } },
          coordinator: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          products: true,
          quotes: true,
          purchaseOrders: true,
          documents: true,
        },
      },
    },
  })
  return project
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [project, catalogueItems, users] = await Promise.all([
    getProject(id),
    prisma.productCatalogue.findMany({
      orderBy: { partCode: "asc" },
      select: { id: true, partCode: true, description: true },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  if (!project) {
    notFound()
  }

  // Calculate department breakdown
  const departmentCounts: Record<string, number> = {}
  const productionStageCounts: Record<string, number> = {}
  project.products.forEach((p) => {
    departmentCounts[p.currentDepartment] = (departmentCounts[p.currentDepartment] || 0) + 1
    if (p.productionStatus) {
      productionStageCounts[p.productionStatus] = (productionStageCounts[p.productionStatus] || 0) + 1
    }
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb & header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/projects" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
            <Badge variant="secondary" className={getProjectStatusColor(project.projectStatus)}>
              {prettifyEnum(project.projectStatus)}
            </Badge>
            <Badge variant="secondary" className={getSalesStageColor(project.salesStage)}>
              {prettifyEnum(project.salesStage)}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
            <span className="font-mono font-medium">{project.projectNumber}</span>
            <span>{prettifyEnum(project.projectType)}</span>
            <span>{prettifyEnum(project.workStream)}</span>
          </div>
        </div>
        <Link href={`/projects/${project.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </Link>
      </div>

      {/* Key info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs font-medium text-gray-500">Customer</p>
                <p className="text-sm font-medium text-gray-900">
                  {project.customer ? (
                    <Link href={`/customers/${project.customer.id}`} className="text-blue-600 hover:text-blue-700">
                      {project.customer.name}
                    </Link>
                  ) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs font-medium text-gray-500">Coordinator</p>
                <p className="text-sm font-medium text-gray-900">{project.coordinator?.name || "Unassigned"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs font-medium text-gray-500">Products</p>
                <p className="text-sm font-medium text-gray-900">{project._count.products}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs font-medium text-gray-500">Target Completion</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(project.targetCompletion)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products ({project._count.products})</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents ({project._count.documents})</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {/* Department breakdown + Add Product */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {Object.entries(departmentCounts).map(([dept, count]) => (
                <div key={dept} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5">
                  <Badge variant="secondary" className={getDepartmentColor(dept)}>
                    {prettifyEnum(dept)}
                  </Badge>
                  <span className="text-sm font-medium text-gray-700">{count}</span>
                </div>
              ))}
            </div>
            <AddProductDialog
              projectId={project.id}
              catalogueItems={catalogueItems}
              users={users}
            />
          </div>

          {/* Products table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Job No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Part</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Details</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Production</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Designer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Due</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">RAG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {project.products.map((product) => {
                      const scheduleRag = calculateScheduleRag(product.requiredCompletionDate)
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{product.productJobNumber || "—"}</td>
                          <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{product.partCode}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{product.description}</td>
                          <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{product.additionalDetails || "—"}</td>
                          <td className="px-4 py-3 text-center font-mono">{product.quantity}</td>
                          <td className="px-4 py-3">
                            <ProductStatusActions
                              productId={product.id}
                              currentDepartment={product.currentDepartment}
                              currentProductionStage={product.productionStatus}
                            />
                          </td>
                          <td className="px-4 py-3">
                            {product.productionStatus ? (
                              <Badge variant="secondary" className={getProductionStageColor(product.productionStatus)}>
                                {prettifyEnum(product.productionStatus)}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{product.designer?.name || "—"}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{formatDate(product.requiredCompletionDate)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className={`mx-auto h-3 w-3 rounded-full ${getRagColor(scheduleRag)}`} />
                          </td>
                        </tr>
                      )
                    })}
                    {project.products.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                          No products added to this project yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Project Number</p>
                    <p className="font-mono text-sm font-medium">{project.projectNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Contract Type</p>
                    <p className="text-sm">{prettifyEnum(project.contractType)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Project Type</p>
                    <p className="text-sm">{prettifyEnum(project.projectType)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Work Stream</p>
                    <p className="text-sm">{prettifyEnum(project.workStream)}</p>
                  </div>
                </div>
                {project.siteLocation && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Site Location</p>
                    <p className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {project.siteLocation}
                    </p>
                  </div>
                )}
                {project.notes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Notes</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-sm text-gray-500">Enquiry Received</span>
                  <span className="text-sm font-medium">{formatDate(project.enquiryReceived)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-sm text-gray-500">Quote Submitted</span>
                  <span className="text-sm font-medium">{formatDate(project.quoteSubmitted)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-sm text-gray-500">Order Received</span>
                  <span className="text-sm font-medium">{formatDate(project.orderReceived)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-sm text-gray-500">Target Completion</span>
                  <span className="text-sm font-medium">{formatDate(project.targetCompletion)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Actual Completion</span>
                  <span className="text-sm font-medium">{formatDate(project.actualCompletion)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-gray-500">Document management coming in Phase D.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
