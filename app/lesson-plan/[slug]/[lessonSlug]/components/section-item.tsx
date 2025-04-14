import type React from "react"

interface SectionItemProps {
  item: {
    section_name: string
    // Add other properties of the section item as needed
  }
}

const SectionItem: React.FC<SectionItemProps> = ({ item }) => {
  return (
    <div>
      <div className="flex items-center gap-x-2 mb-2">
        <p className="text-sm font-medium">{item.section_name}</p>
      </div>
      {/* Rest of the section item content can be added here */}
    </div>
  )
}

export default SectionItem
