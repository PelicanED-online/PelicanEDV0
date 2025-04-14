"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useRouter } from "next/navigation"
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
    headers: ["", ""],
    rows: [{ id: generateId(), cells: ["", ""] }],
    headerCells: [],
    answerCells: [],
  })

  // Track header and answer cells
  const [headerCells, setHeaderCells] = useState<{ row: number; col: number }[]>([])
  const [answerCells, setAnswerCells] = useState<{ row: number; col: number }[]>([])

  // Multi-step form state
  const [step, setStep] = useState<"template" | "dimensions" | "data" | "result">("template")
  const [columns, setColumns] = useState<number>(2)
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
            headers: content.headers || ["", ""],
            rows: content.rows || [{ id: generateId(), cells: ["", ""] }],
            headerCells: content.headerCells || [],
            answerCells: content.answerCells || [],
          })
          setColumns(content.headers?.length || 2)
          setRows(content.rows?.length || 1)
          setStep("data")
        } catch (error) {
          console.error("Error parsing table data:", error)
          // Reset to default if there's an error
          setTableData({
            headers: ["", ""],
            rows: [{ id: generateId(), cells: ["", ""] }],
            headerCells: [],
            answerCells: [],
          })
          setColumns(2)
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
        headers: ["", ""],
        rows: [{ id: generateId(), cells: ["", ""] }],
        headerCells: [],
        answerCells: [],
      })
      setColumns(2)
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

    setTableData(initialData)
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
    if (tableData.headers.length <= 2) return // Minimum 2 columns

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
    setTableData((prev) => ({
      ...prev,
      rows: prev.rows.filter((row) => row.id !== id),
    }))
    setHeaderCells((prev) => prev.filter((cell) => cell.row !== id))
    setAnswerCells((prev) => prev.filter((cell) => cell.row !== id))
  }

  const generateJson = () => {
    // Create a comprehensive JSON structure with metadata
    const result: {
      headers: string[]
      rows: { id: string; cells: string[] }[]
      headerCells: { row: number; col: number }[]
      answerCells: { row: number; col: number }[]
    } = {
      headers: tableData.headers,
      rows: tableData.rows,
      headerCells: headerCells,
      answerCells: answerCells,
    }

    setJsonResult(JSON.stringify(result, null, 2))
    setStep("result")
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
                      min="2"
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
                    disabled={columns <= 1 || rows <= 0}
                    className="bg-[#ff3300] hover:bg-[#e62e00] text-white"
                  >
                    Continue to Data Entry
                  </Button>
                </div>
              </div>
            )}

            {formData.template_type === "Table" && step === "data" && (
              <div className="space-y-6 pt-4">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">For each cell, select its type:</p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>
                      <span className="font-medium">Normal</span> - Regular data cell
                    </li>
                    <li>
                      <span className="font-medium">Header</span> - Used as property names in the JSON
                    </li>
                    <li>
                      <span className="font-medium text-[#ff3300]">Answer</span> - Designated for student answers
                    </li>
                  </ul>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 border bg-gray-100 text-left w-24">Row/Col</th>
                        {Array.from({ length: columns }).map((_, colIndex) => (
                          <th key={colIndex} className="p-2 border bg-gray-100 text-center">
                            <span>Col {colIndex + 1}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.map((row, rowIndex) => (
                        <tr key={row.id}>
                          <td className="p-2 border bg-gray-50">
                            <span>Row {rowIndex + 1}</span>
                          </td>
                          {row.cells.map((cell, cellIndex) => {
                            return (
                              <td
                                key={cellIndex}
                                className={cn(
                                  "p-2 border",
                                  isCellHeader(rowIndex, cellIndex) && "bg-blue-100",
                                  isCellAnswer(rowIndex, cellIndex) && "bg-[#fff0ee]",
                                )}
                              >
                                <div className="space-y-2">
                                  <Input
                                    value={cell}
                                    onChange={(e) => handleDataChange(rowIndex, cellIndex, e.target.value)}
                                    placeholder={
                                      isCellHeader(rowIndex, cellIndex)
                                        ? "Header name"
                                        : isCellAnswer(rowIndex, cellIndex)
                                          ? "Answer placeholder"
                                          : "Value"
                                    }
                                    className={cn(
                                      "focus-visible:ring-[#ff3300]",
                                      isCellHeader(rowIndex, cellIndex) && "font-medium",
                                      isCellAnswer(rowIndex, cellIndex) && "border-[#ff3300] bg-[#fff5f3]",
                                    )}
                                  />
                                  <ToggleGroup
                                    type="single"
                                    size="sm"
                                    value={getCellType(rowIndex, cellIndex)}
                                    onValueChange={(value) => {
                                      if (value) setCellType(rowIndex, cellIndex, value)
                                    }}
                                    className="justify-center"
                                  >
                                    <ToggleGroupItem value="normal" className="text-xs px-2">
                                      Normal
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="header" className="text-xs px-2">
                                      Header
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                      value="answer"
                                      className="text-xs px-2 data-[state=on]:bg-[#ff3300] data-[state=on]:text-white"
                                    >
                                      Answer
                                    </ToggleGroupItem>
                                  </ToggleGroup>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep("dimensions")}
                    className="border-[#ff3300]/20 text-[#ff3300] hover:bg-[#fff5f3] hover:text-[#e62e00]"
                  >
                    Back
                  </Button>
                  <Button onClick={generateJson} className="bg-[#ff3300] hover:bg-[#e62e00] text-white">
                    Generate JSON
                  </Button>
                </div>
              </div>
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
