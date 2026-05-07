import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

export interface TicketFormData {
  name: string
  email: string
  subject: string
  description: string
  website: string
  lgpd: boolean
}

export function TicketFormFields({
  formData,
  setFormData,
  disabled,
}: {
  formData: TicketFormData
  setFormData: (data: TicketFormData) => void
  disabled?: boolean
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Assunto</Label>
        <Input
          id="subject"
          required
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          required
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
        aria-hidden="true"
      >
        <label htmlFor="hp-website">Não preencha este campo</label>
        <input
          id="hp-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          disabled={disabled}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="lgpd"
          checked={formData.lgpd}
          onCheckedChange={(c) => setFormData({ ...formData, lgpd: c as boolean })}
          disabled={disabled}
        />
        <Label htmlFor="lgpd" className="text-sm font-normal text-gray-600">
          Concordo com os Termos e Condições (LGPD)
        </Label>
      </div>
    </>
  )
}
