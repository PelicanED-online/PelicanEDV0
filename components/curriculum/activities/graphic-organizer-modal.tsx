"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Trash } from "lucide-react"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

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
  })

  // Track header and answer cells
  const [headerCells, setHeaderCells] = useState<{ row: number; col: number }[]>([])
  const [answerCells, setAnswerCells] = useState<{ row: number; col: number }[]>([])

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
          })
          setHeaderCells(content.headerCells || [])
          setAnswerCells(content.answerCells || [])
        } catch (error) {
          console.error("Error parsing table data:", error)
          // Reset to default if there's an error
          setTableData({
            headers: ["", ""],
            rows: [{ id: generateId(), cells: ["", ""] }],
          })
          setHeaderCells([])
          setAnswerCells([])
        }
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
      })
      setHeaderCells([])
      setAnswerCells([])
    }
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      published: checked ? "Yes" : "No", // Convert boolean to "Yes"/"No"
    }))
  }

  // Table specific handlers
  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...tableData.headers]
    newHeaders[index] = value
    setTableData({ ...tableData, headers: newHeaders })
  }

  const handleCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    const newRows = [...tableData.rows]
    newRows[rowIndex].cells[cellIndex] = value
    setTableData({ ...tableData, rows: newRows })
  }

  const addColumn = () => {
    const newHeaders = [...tableData.headers, ""]
    const newRows = tableData.rows.map((row) => ({
      ...row,
      cells: [...row.cells, ""],
    }))
    setTableData({ headers: newHeaders, rows: newRows })
  }

  const removeColumn = (index: number) => {
    if (tableData.headers.length <= 2) return // Minimum 2 columns

    const newHeaders = tableData.headers.filter((_, i) => i !== index)
    const newRows = tableData.rows.map((row) => ({
      ...row,
      cells: row.cells.filter((_, i) => i !== index),
    }))
    setTableData({ headers: newHeaders, rows: newRows })
    setHeaderCells((prev) => prev.map((cell) => (cell.col > index ? { ...cell, col: cell.col - 1 } : cell)))
    setAnswerCells((prev) => prev.map((cell) => (cell.col > index ? { ...cell, col: cell.col - 1 } : cell)))
  }

  const addRow = () => {
    const newRow = {
      id: generateId(),
      cells: Array(tableData.headers.length).fill(""),
    }
    setTableData({ ...tableData, rows: [...tableData.rows, newRow] })
  }

  const removeRow = (id: string) => {
    if (tableData.rows.length <= 1) return // Minimum 1 row

    const newRows = tableData.rows.filter((row) => row.id !== id)
    setTableData({ ...tableData, rows: newRows })
    setHeaderCells((prev) => prev.filter((cell) => cell.row !== id))
    setAnswerCells((prev) => prev.filter((cell) => cell.row !== id))
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Prepare content based on template type
    let content = {}

    if (formData.template_type === "Table") {
      content = {
        ...tableData,
        headerCells,
        answerCells,
      }
    }

    onSave({
      ...formData,
      content,
    })
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

            {formData.template_type === "Table" && (
              <div className="space-y-4 border p-4 rounded-md">
                <h3 className="text-lg font-medium">Table Configuration</h3>

                {/* Headers */}
                <div className="flex items-center space-x-2">
                  {tableData.headers.map((header, index) => (
                    <div key={index} className="flex-1">
                      <Label htmlFor={`header-${index}`}>Column {index + 1}</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id={`header-${index}`}
                          value={header}
                          onChange={(e) => handleHeaderChange(index, e.target.value)}
                          placeholder={`Column ${index + 1}`}
                          className="flex-1"
                        />
                        {tableData.headers.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeColumn(index)}
                            className="ml-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="icon" onClick={addColumn} className="mt-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Rows */}
                <div className="space-y-3">
                  {tableData.rows.map((row, rowIndex) => (
                    <div key={row.id} className="flex items-center space-x-2">
                      {row.cells.map((cell, cellIndex) => (
                        <div key={cellIndex} className="flex-1">
                          <Input
                            value={cell}
                            onChange={(e) => handleCellChange(rowIndex, cellIndex, e.target.value)}
                            placeholder={`Row ${rowIndex + 1}, Col ${cellIndex + 1}`}
                          />
                        </div>
                      ))}
                      {tableData.rows.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addRow} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Add Row
                  </Button>
                </div>

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
                        {Array.from({ length: tableData.headers.length }).map((_, colIndex) => (
                          <th key={colIndex} className="p-2 border bg-gray-100 text-center">
                            <span>Col {colIndex + 1}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="p-2 border bg-gray-50">
                            <span>Row {rowIndex + 1}</span>
                          </td>
                          {row.cells.map((cell, colIndex) => (
                            <td
                              key={colIndex}
                              className={cn(
                                "p-2 border",
                                isCellHeader(rowIndex, colIndex) && "bg-blue-100",
                                isCellAnswer(rowIndex, colIndex) && "bg-[#fff0ee]",
                              )}
                            >
                              <div className="space-y-2">
                                <ToggleGroup
                                  type="single"
                                  size="sm"
                                  value={getCellType(rowIndex, colIndex)}
                                  onValueChange={(value) => {
                                    if (value) setCellType(rowIndex, colIndex, value)
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
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

        <DialogFooter className="flex-shrink-0 pt-2 border-t">
          <Button type="submit" onClick={handleSubmit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
