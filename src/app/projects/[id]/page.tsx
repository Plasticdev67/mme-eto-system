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
  Flame,
  Siren,
  AlertTriangle,
  PoundSterling,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import {
  formatDate,
  formatCurrency,
  getProjectStatusColor,
  getSalesStageColor,
  getDepartmentColor,
  getProductionStageColor,
  prettifyEnum,
  calculateScheduleRag,
  getRagColor,
} from "@/lib/utils"
import { ProductStatusActions } from "@/components/projects/product-status-actions"
import { AddProductDialog } from "@/components/projects/add-product-dialog"
import { RaiseNcrDialog } from "@/components/projects/raise-ncr-dialog"

async function getProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      coordinator: true,
      projectManager: { select: { name: true } },
      installManager: { select: { name: true } },
      products: {
        include: {
          designer: { select: { name: true } },
          coordinator: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      ncrs: {
        orderBy: { raisedDate: "desc" },
        include: {
          project: { select: { partCode: true, description: true } },
        },
      },
      retentions: {
        orderBy: { createdAt: "desc" },
      },
      plantHires: {
        orderBy: { createdAt: "desc" },
        include: { supplier: { select: { name: true } } },
      },
      subContracts: {
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { name: true } },
          product: { select: { partCode: true, description: true } },
        },
      },
      costCategories: {
        orderBy: { costCode: "asc" },
      },
      _count: {
        select: {
          products: true,
          quotes: true,
          purchaseOrders: true,
          documents: true,
          ncrs: true,
        },
      },
    },
  })
  return project
}

function getRagBadge(rag: string | null) {
  if (!rag) return null
  const colors: Record<string, string> = {
    GREEN: "bg-green-100 text-green-700",
    AMBER: "bg-amber-100 text-amber-700",
    RED: "bg-red-100 text-red-700",
  }
  return <Badge variant="secondary" className={colors[rag] || ""}>{rag}</Badge>
}

function getNcrSeverityColor(severity: string) {
  const colors: Record<string, string> = {
    MINOR: "bg-yellow-100 text-yellow-700",
    MAJOR: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  }
  return colors[severity] || "bg-gray-100 text-gray-700"
}

function getNcrStatusColor(status: string) {
  const colors: Record<string, string> = {
    OPEN: "bg-red-100 text-red-700",
    INVESTIGATING: "bg-amber-100 text-amber-700",
    RESOLVED: "bg-blue-100 text-blue-700",
    CLOSED: "bg-green-100 text-green-700",
  }
  return colors[status] || "bg-gray-100 text-gray-700"
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
  project.products.forEach((p) => {
    departmentCounts[p.currentDepartment] = (departmentCounts[p.currentDepartment] || 0) + 1
  })

  const estimatedValue = Number(project.estimatedValue) || 0
  const contractValue = Number(project.contractValue) || 0
  const currentCost = Number(project.currentCost) || 0
  const ncrCost = Number(project.ncrCost) || 0

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
            {getRagBadge(project.ragStatus)}
            {project.isICUFlag && (
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                <Siren className="mr-1 h-3 w-3" /> ICU
              </Badge>
            )}
            {project.priority === "CRITICAL" && !project.isICUFlag && (
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                <Flame className="mr-1 h-3 w-3" /> Critical
              </Badge>
            )}
            {project.priority === "HIGH" && !project.isICUFlag && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                <AlertTriangle className="mr-1 h-3 w-3" /> High
              </Badge>
            )}
            {project.classification === "MEGA" && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">Mega</Badge>
            )}
            {project.classification === "SUB_CONTRACT" && (
              <Badge variant="secondary" className="bg-teal-100 text-teal-700">Sub-contract</Badge>
            )}
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
                <p className="text-xs font-medium text-gray-500">Project Manager</p>
                <p className="text-sm font-medium text-gray-900">{project.projectManager?.name || "Unassigned"}</p>
                {project.coordinator && (
                  <p className="text-xs text-gray-400">Coord: {project.coordinator.name}</p>
                )}
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

      {/* Financial cards */}
      {(estimatedValue > 0 || contractValue > 0 || currentCost > 0 || ncrCost > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <PoundSterling className="h-3.5 w-3.5" /> Estimated Value
              </div>
              <div className="text-lg font-mono font-medium text-gray-900">
                {estimatedValue ? formatCurrency(estimatedValue) : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <PoundSterling className="h-3.5 w-3.5" /> Contract Value
              </div>
              <div className="text-lg font-mono font-semibold text-blue-700">
                {contractValue ? formatCurrency(contractValue) : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <PoundSterling className="h-3.5 w-3.5" /> Current Cost
              </div>
              <div className="text-lg font-mono font-medium text-gray-900">
                {currentCost ? formatCurrency(currentCost) : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <PoundSterling className="h-3.5 w-3.5" /> NCR Cost
              </div>
              <div className={`text-lg font-mono font-medium ${ncrCost > 0 ? "text-red-600" : "text-gray-900"}`}>
                {ncrCost ? formatCurrency(ncrCost) : "—"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products ({project._count.products})</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ncrs">NCRs ({project._count.ncrs})</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="documents">Documents ({project._count.documents})</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
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
          {/* P0-P5 Lifecycle Gates */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Project Lifecycle</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const stages = [
                  { key: "P0", label: "Enquiry", date: project.p0Date },
                  { key: "P1", label: "Quotation", date: project.p1Date },
                  { key: "P2", label: "Order Handover", date: project.p2Date },
                  { key: "P3", label: "Design Review", date: project.p3Date },
                  { key: "P4", label: "Production Complete", date: project.p4Date },
                  { key: "P5", label: "Handover / Close", date: project.p5Date },
                ]
                const stageOrder = ["P0", "P1", "P2", "P3", "P4", "P5"]
                const currentIdx = stageOrder.indexOf(project.lifecycleStage)

                return (
                  <div className="flex items-center gap-0">
                    {stages.map((stage, idx) => {
                      const isComplete = idx < currentIdx
                      const isCurrent = idx === currentIdx
                      const isFuture = idx > currentIdx
                      return (
                        <div key={stage.key} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                              isComplete
                                ? "border-green-500 bg-green-500 text-white"
                                : isCurrent
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-gray-200 bg-white text-gray-400"
                            }`}>
                              {isComplete ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                stage.key
                              )}
                            </div>
                            <span className={`mt-1.5 text-[10px] font-medium text-center ${
                              isCurrent ? "text-blue-700" : isComplete ? "text-green-700" : "text-gray-400"
                            }`}>
                              {stage.label}
                            </span>
                            {stage.date && (
                              <span className="text-[9px] text-gray-400">{formatDate(stage.date)}</span>
                            )}
                          </div>
                          {idx < stages.length - 1 && (
                            <div className={`h-0.5 flex-1 -mt-4 ${
                              idx < currentIdx ? "bg-green-500" : "bg-gray-200"
                            }`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </CardContent>
          </Card>

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
                  <div>
                    <p className="text-xs font-medium text-gray-500">Classification</p>
                    <p className="text-sm">{prettifyEnum(project.classification)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Priority</p>
                    <p className="text-sm">{prettifyEnum(project.priority)}</p>
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
                {project.projectRegion && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Region</p>
                    <p className="text-sm">{project.projectRegion}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Install Manager</p>
                    <p className="text-sm">{project.installManager?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Delivery Type</p>
                    <p className="text-sm">{project.deliveryType || "—"}</p>
                  </div>
                </div>
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

        {/* NCRs Tab */}
        <TabsContent value="ncrs" className="space-y-4">
          <div className="flex justify-end">
            <RaiseNcrDialog
              projectId={project.id}
              products={project.products.map((p) => ({ id: p.id, partCode: p.partCode, description: p.description }))}
            />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">NCR No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Cost Impact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Raised</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Closed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {project.ncrs.map((ncr) => (
                      <tr key={ncr.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{ncr.ncrNumber}</td>
                        <td className="px-4 py-3 text-gray-900">{ncr.title}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {ncr.project ? `${ncr.project.partCode} — ${ncr.project.description}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={getNcrSeverityColor(ncr.severity)}>
                            {ncr.severity}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={getNcrStatusColor(ncr.status)}>
                            {prettifyEnum(ncr.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm">
                          {ncr.costImpact ? (
                            <span className="text-red-600">{formatCurrency(Number(ncr.costImpact))}</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(ncr.raisedDate)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(ncr.closedDate)}</td>
                      </tr>
                    ))}
                    {project.ncrs.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                          No NCRs raised for this project.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-6">
          {/* Retentions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Retention Holdbacks</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Retention %</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Release Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {project.retentions.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-right font-mono text-sm">{r.retentionPercent ? `${Number(r.retentionPercent)}%` : "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm">{r.retentionAmount ? formatCurrency(Number(r.retentionAmount)) : "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{formatDate(r.releaseDate)}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="secondary" className={r.status === "RELEASED" ? "bg-green-100 text-green-700" : r.status === "PARTIALLY_RELEASED" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}>
                            {prettifyEnum(r.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{r.notes || "—"}</td>
                      </tr>
                    ))}
                    {project.retentions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No retention holdbacks recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Plant Hire */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plant Hire</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Start</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">End</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Weekly Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Total Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {project.plantHires.map((ph) => (
                      <tr key={ph.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-900">{ph.description}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{ph.supplier?.name || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{formatDate(ph.hireStart)}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{formatDate(ph.hireEnd)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm">{ph.weeklyRate ? formatCurrency(Number(ph.weeklyRate)) : "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm font-medium">{ph.totalCost ? formatCurrency(Number(ph.totalCost)) : "—"}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="secondary" className={ph.status === "RETURNED" ? "bg-green-100 text-green-700" : ph.status === "OFF_HIRE" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}>
                            {prettifyEnum(ph.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {project.plantHires.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No plant hire recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Sub-Contractor Work */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sub-Contractor Work</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Agreed Value</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Invoiced</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {project.subContracts.map((sc) => (
                      <tr key={sc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-900">{sc.description}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{sc.supplier?.name || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{sc.product ? `${sc.product.partCode}` : "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm">{sc.agreedValue ? formatCurrency(Number(sc.agreedValue)) : "—"}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm">{sc.invoicedToDate ? formatCurrency(Number(sc.invoicedToDate)) : "—"}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="secondary" className={sc.status === "COMPLETE" ? "bg-green-100 text-green-700" : sc.status === "DISPUTED" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}>
                            {prettifyEnum(sc.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {project.subContracts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No sub-contractor work recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Cost Categories (Sage) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost Categories (Sage)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cost Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Budget</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Committed</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actual</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {project.costCategories.map((cc) => {
                      const budget = Number(cc.budgetAmount) || 0
                      const actual = Number(cc.actualAmount) || 0
                      const variance = budget - actual
                      return (
                        <tr key={cc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-700">{cc.costCode}</td>
                          <td className="px-4 py-2.5 text-gray-900">{cc.description}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-sm">{budget ? formatCurrency(budget) : "—"}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-sm">{cc.committedAmount ? formatCurrency(Number(cc.committedAmount)) : "—"}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-sm">{actual ? formatCurrency(actual) : "—"}</td>
                          <td className={`px-4 py-2.5 text-right font-mono text-sm font-medium ${variance >= 0 ? "text-green-700" : "text-red-600"}`}>
                            {budget ? formatCurrency(variance) : "—"}
                          </td>
                        </tr>
                      )
                    })}
                    {project.costCategories.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No cost categories set up. Add via Sage integration.</td>
                      </tr>
                    )}
                    {project.costCategories.length > 0 && (
                      <tr className="bg-gray-50 font-medium">
                        <td colSpan={2} className="px-4 py-2.5 text-right text-sm text-gray-700">Totals</td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-900">
                          {formatCurrency(project.costCategories.reduce((sum, cc) => sum + (Number(cc.budgetAmount) || 0), 0))}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-900">
                          {formatCurrency(project.costCategories.reduce((sum, cc) => sum + (Number(cc.committedAmount) || 0), 0))}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-900">
                          {formatCurrency(project.costCategories.reduce((sum, cc) => sum + (Number(cc.actualAmount) || 0), 0))}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-mono text-sm font-semibold ${
                          project.costCategories.reduce((sum, cc) => sum + ((Number(cc.budgetAmount) || 0) - (Number(cc.actualAmount) || 0)), 0) >= 0
                            ? "text-green-700"
                            : "text-red-600"
                        }`}>
                          {formatCurrency(project.costCategories.reduce((sum, cc) => sum + ((Number(cc.budgetAmount) || 0) - (Number(cc.actualAmount) || 0)), 0))}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-gray-500">Document management coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
