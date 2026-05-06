import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { SettingsLayoutBase } from '@/components/SettingsLayoutBase'
import { useToast } from '@/hooks/use-toast'
import { getSetting, upsertSetting } from '@/services/settings'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface General {
  brand_name?: string
  support_email?: string
  default_priority?: string
  auto_close_resolved_after_days?: number
  signup_enabled?: boolean
  notify_on_assign?: boolean
}

export function SettingsGeneral() {
  const { toast } = useToast()
  const [data, setData] = useState<General>({
    brand_name: 'Helpdesk',
    support_email: '',
    default_priority: 'medium',
    auto_close_resolved_after_days: 7,
    signup_enabled: true,
    notify_on_assign: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSetting('general').then((v) => {
      if (v && typeof v === 'object') setData((d) => ({ ...d, ...(v as General) }))
    })
  }, [])

  const set = <K extends keyof General>(k: K, v: General[K]) => setData({ ...data, [k]: v })

  const handleSave = async () => {
    setSaving(true)
    try {
      await upsertSetting('general', data)
      toast({ title: 'Configurações salvas!' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao salvar',
        description: getErrorMessage(err),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsLayoutBase
      title="Geral"
      description="Configurações básicas do helpdesk: marca, email de suporte e padrões."
      headerActions={
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" /> {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      }
    >
      <div className="space-y-6 max-w-xl">
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="brand_name">Nome da marca</Label>
              <Input
                id="brand_name"
                value={data.brand_name || ''}
                onChange={(e) => set('brand_name', e.target.value)}
                placeholder="Helpdesk"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support_email">E-mail de suporte</Label>
              <Input
                id="support_email"
                type="email"
                value={data.support_email || ''}
                onChange={(e) => set('support_email', e.target.value)}
                placeholder="suporte@empresa.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auto_close">Fechar automaticamente após (dias)</Label>
              <Input
                id="auto_close"
                type="number"
                value={data.auto_close_resolved_after_days || 0}
                onChange={(e) =>
                  set('auto_close_resolved_after_days', parseInt(e.target.value) || 0)
                }
                placeholder="7"
              />
              <p className="text-xs text-gray-500">
                Chamados resolvidos serão fechados automaticamente após N dias sem atividade.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Cadastro público</p>
                <p className="text-xs text-gray-500">
                  Permitir que clientes criem contas próprias.
                </p>
              </div>
              <Switch
                checked={!!data.signup_enabled}
                onCheckedChange={(v) => set('signup_enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notificar ao atribuir</p>
                <p className="text-xs text-gray-500">
                  Enviar notificação ao agente quando um chamado for atribuído a ele.
                </p>
              </div>
              <Switch
                checked={!!data.notify_on_assign}
                onCheckedChange={(v) => set('notify_on_assign', v)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayoutBase>
  )
}
