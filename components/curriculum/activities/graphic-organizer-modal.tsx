"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import TableGraphicOrganizer from "./table-graphic-organizer"
import { Save } from "lucide-react"

interface ActivityType {
  id: string
  activity_id: string
  type: "reading" | "source" | "question" | "graphic_organizer"
  order: number
}

interface GraphicOrganizer {
  activity_id: string
  go_id?: string
  content?: any
  order?: number
  template_type?: string
  published?: string
}

interface GraphicOrganizerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: ActivityType
  initialData?: GraphicOrganizer
  onSave: (organizer: GraphicOrganizer) => void
}

// Table structure for the Table template
interface TableRow {
  id: string
  cells: string[]
}

interface TableData {
  headers: string[]
  rows: TableRow[]
  headerCells: { row: number; col: number }[]
  answerCells: { row: number; col: number }[]
}

// Generate a random ID for new rows
const generateId = () => Math.random().toString(36).substring(2, 9)

export function GraphicOrganizerModal({
  open,
  onOpenChange,
  activity,
  initialData,
  onSave,
}: GraphicOrganizerModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<GraphicOrganizer>({
    activity_id: "",
    template_type: "",
    content: {},
    published: "No", // Default to "No"
  })

  // Table specific state
  const [tableData, setTableData] = useState<TableData>({
    headers: [""],
    rows: [{ id: generateId(), cells: [""] }],
    headerCells: [],
    answerCells: [],
  })

  // Track header and answer cells
  const [headerCells, setHeaderCells] = useState<{ row: number; col: number }[]>([])
  const [answerCells, setAnswerCells] = useState<{ row: number; col: number }[]>([])

  // Multi-step form state
  const [step, setStep] = useState<"template" | "dimensions" | "data" | "result">("template")
  const [columns, setColumns] = useState<number>(1)
  const [rows, setRows] = useState<number>(1)
  const [jsonResult, setJsonResult] = useState<string>("")

  useEffect(() => {
    if (activity && open) {
      // Initialize base form data
      setFormData({
        activity_id: activity.activity_id,
        go_id: initialData?.go_id, // Include go_id if it exists
        template_type: initialData?.template_type || "",
        content: initialData?.content || {},
        order: activity.order,
        published: initialData?.published || "No", // Default to "No" if not set
      })

      // Initialize table-specific data if we have initial data
      if (initialData?.template_type === "Table" && initialData?.content) {
        try {
          const content = initialData.content
          setTableData({
            headers: content.headers || [""],
            rows: content.rows || [{ id: generateId(), cells: [""] }],
            headerCells: content.headerCells || [],
            answerCells: content.answerCells || [],
          })
          setColumns(content.headers?.length || 1)
          setRows(content.rows?.length || 1)
          setStep("result")
        } catch (error) {
          console.error("Error parsing table data:", error)
          // Reset to default if there's an error
          setTableData({
            headers: [""],
            rows: [{ id: generateId(), cells: [""] }],
            headerCells: [],
            answerCells: [],
          })
          setColumns(1)
          setRows(1)
          setStep("dimensions")
        }
      } else {
        setStep("template")
      }
    }
  }, [activity, initialData, open])

  const handleTemplateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      template_type: value,
      // Reset content when template changes
      content: {},
    }))

    // Reset table-specific data
    if (value === "Table") {
      setTableData({
        headers: [""],
        rows: [{ id: generateId(), cells: [""] }],
        headerCells: [],
        answerCells: [],
      })
      setColumns(1)
      setRows(1)
      setStep("dimensions")
    } else {
      setStep("template")
    }
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      published: checked ? "Yes" : "No", // Convert boolean to "Yes"/"No"
    }))
  }

  const handleDimensionsSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Initialize the table data with empty strings
    const initialData: string[][] = Array(rows)
      .fill(null)
      .map(() => Array(columns).fill(""))

    setTableData({
      headers: tableData.headers,
      rows: initialData.map((row) => ({ id: generateId(), cells: row })),
      headerCells: [],
      answerCells: [],
    })
    setHeaderCells([])
    setAnswerCells([])
    setStep("data")
  }

  const handleDataChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = {
      ...tableData,
      rows: tableData.rows.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              cells: row.cells.map((cell, j) => (j === colIndex ? value : cell)),
            }
          : row,
      ),
    }
    setTableData(newData)
  }

  // Check if a cell is a header
  const isCellHeader = (rowIndex: number, colIndex: number) => {
    return headerCells.some((cell) => cell.row === rowIndex && cell.col === colIndex)
  }

  // Check if a cell is an answer cell
  const isCellAnswer = (rowIndex: number, colIndex: number) => {
    return answerCells.some((cell) => cell.row === rowIndex && cell.col === colIndex)
  }

  // Get cell type (normal, header, or answer)
  const getCellType = (rowIndex: number, colIndex: number) => {
    if (isCellHeader(rowIndex, colIndex)) return "header"
    if (isCellAnswer(rowIndex, colIndex)) return "answer"
    return "normal"
  }

  // Set cell type
  const setCellType = (rowIndex: number, colIndex: number, type: string) => {
    // Remove from both arrays first
    setHeaderCells((prev) => prev.filter((cell) => !(cell.row === rowIndex && cell.col === colIndex)))
    setAnswerCells((prev) => prev.filter((cell) => !(cell.row === rowIndex && cell.col === colIndex)))

    // Then add to the appropriate array
    if (type === "header") {
      setHeaderCells((prev) => [...prev, { row: rowIndex, col: colIndex }])
    } else if (type === "answer") {
      setAnswerCells((prev) => [...prev, { row: rowIndex, col: colIndex }])
    }
  }

  const addColumn = () => {
    setTableData((prev) => ({
      ...prev,
      headers: [...prev.headers, ""],
      rows: prev.rows.map((row) => ({
        ...row,
        cells: [...row.cells, ""],
      })),
    }))
  }

  const removeColumn = (index: number) => {
    if (tableData.headers.length <= 1) return // Minimum 1 columns

    setTableData((prev) => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index),
      rows: prev.rows.map((row) => ({
        ...row,
        cells: row.cells.filter((_, i) => i !== index),
      })),
    }))
    setHeaderCells((prev) => prev.map((cell) => (cell.col > index ? { ...cell, col: cell.col - 1 } : cell)))
    setAnswerCells((prev) => prev.map((cell) => (cell.col > index ? { ...cell, col: cell.col - 1 } : cell)))
  }

  const addRow = () => {
    setTableData((prev) => ({
      ...prev,
      rows: [...prev.rows, { id: generateId(), cells: Array(prev.headers.length).fill("") }],
    }))
  }

  const removeRow = (id: string) => {
    if (tableData.rows.length <= 1) return // Minimum 1 row

    setTableData((prev) => ({
      ...prev,
      rows: prev.rows.filter((row) => row.id !== id),
    }))
    setHeaderCells((prev) => prev.filter((cell) => cell.row !== id))
    setAnswerCells((prev) => prev.filter((cell) => cell.row !== id))
  }

  const handleSaveTable = () => {
    // Prepare content based on template type
    let content = {}

    if (formData.template_type === "Table") {
      content = {
        headers: tableData.headers,
        rows: tableData.rows,
        headerCells: headerCells,
        answerCells: answerCells,
      }
    }

    onSave({
      ...formData,
      content,
    })
    onOpenChange(false)
    router.back()
  }

  const generateJson = () => {
    // Prepare data for JSON conversion
    const headers = tableData.headers
    const rows = tableData.rows

    // Find the header and answer cells
    const headerCells = tableData.headerCells
    const answerCells = tableData.answerCells

    // Convert table data to JSON format
    const jsonData = rows.map((row) => {
      const rowData: { [key: string]: string } = {}

      row.cells.forEach((cell, index) => {
        const headerCell = headerCells.find((h) => h.col === index)
        const answerCell = answerCells.find((a) => a.col === index)

        if (headerCell) {
          // If it's a header cell, use its value as the key
          rowData[cell] = "" // Initialize with an empty string
        }
      })

      row.cells.forEach((cell, index) => {
        const headerCell = headerCells.find((h) => h.col === index)
        const answerCell = answerCells.find((a) => a.col === index)

        if (headerCell) {
          // If it's a header cell, use its value as the key
          const headerValue = cell
          const answerColIndex = index

          // Find the corresponding answer cell in the same row
          const answerCellInRow = answerCells.find((a) => a.row === rows.indexOf(row) && a.col === answerColIndex)

          if (answerCellInRow) {
            rowData[headerValue] = cell // Assign the value to the corresponding header
          }
        }
      })

      return rowData
    })

    // Convert JSON data to a formatted string
    const jsonString = JSON.stringify(jsonData, null, 2)
    setJsonResult(jsonString)
    setStep("result")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission logic here
    console.log("Form submitted")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Graphic Organizer Activity</DialogTitle>
          <DialogDescription>
            Create or edit a graphic organizer activity. Select a template and configure its content.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {step === "template" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="template_type" className="text-right">
                  Template Type
                </Label>
                <div className="col-span-3">
                  <Select value={formData.template_type} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Table">Table</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {formData.template_type === "Table" && step === "dimensions" && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="columns">Number of Columns</Label>
                    <Input
                      id="columns"
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={columns || ""}
                      onChange={(e) => setColumns(Number.parseInt(e.target.value) || 0)}
                      placeholder="Enter number of columns"
                      className="focus-visible:ring-[#ff3300]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rows">Number of Rows</Label>
                    <Input
                      id="rows"
                      type="number"
                      min="1"
                      max="50"
                      required
                      value={rows || ""}
                      onChange={(e) => setRows(Number.parseInt(e.target.value) || 0)}
                      placeholder="Enter number of rows"
                      className="focus-visible:ring-[#ff3300]"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep("template")}
                    className="border-[#ff3300]/20 text-[#ff3300] hover:bg-[#fff5f3] hover:text-[#e62e00]"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleDimensionsSubmit}
                    disabled={columns <= 0 || rows <= 0}
                    className="bg-[#ff3300] hover:bg-[#e62e00] text-white"
                  >
                    Continue to Data Entry
                  </Button>
                </div>
              </div>
            )}

            {formData.template_type === "Table" && step === "data" && (
              <TableGraphicOrganizer
                columns={columns}
                rows={rows}
                tableData={tableData}
                headerCells={headerCells}
                answerCells={answerCells}
                setTableData={setTableData}
                setHeaderCells={setHeaderCells}
                setAnswerCells={setAnswerCells}
              />
            )}

            {formData.template_type === "Table" && step === "result" && (
              <div className="space-y-6 pt-4">
                <div className="p-4 border rounded-md border-[#ff3300]/20 bg-[#fff8f7] max-h-[400px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-all">{jsonResult}</pre>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep("data")}
                    className="border-[#ff3300]/20 text-[#ff3300] hover:bg-[#fff5f3] hover:text-[#e62e00]"
                  >
                    Back to Data
                  </Button>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(jsonResult)
                    }}
                    variant="outline"
                    className="border-[#ff3300]/20 text-[#ff3300] hover:bg-[#fff5f3] hover:text-[#e62e00]"
                  >
                    Copy to Clipboard
                  </Button>
                  <Button onClick={handleSaveTable} className="bg-[#ff3300] hover:bg-[#e62e00] text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Table
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="published" className="text-right">
                Published
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch id="published" checked={formData.published === "Yes"} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="published" className="text-sm text-muted-foreground">
                  {formData.published}
                </Label>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
