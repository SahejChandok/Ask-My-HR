import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TenantShiftConfig } from '../../types/shift';
import { ShiftRuleGroupForm } from '../../components/shifts/ShiftRuleGroupForm';
import { ShiftRuleGroupList } from '../../components/shifts/ShiftRuleGroupList'; 
import { ShiftRulesSummary } from '../../components/shifts/ShiftRulesSummary';
import { ShiftRulesKnowledgeBase } from '../../components/shifts/ShiftRulesKnowledgeBase';
import { getShiftRuleGroups, createShiftRuleGroup, updateShiftRuleGroup, deleteShiftRuleGroup } from '../../services/shiftRules';

export function ShiftRulesAdmin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<TenantShiftConfig[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<TenantShiftConfig>();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadGroups();
  }, [user?.tenant_id]);

  async function loadGroups() {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      setError(undefined);
      const data = await getShiftRuleGroups(user.tenant_id);
      setGroups(data);
    } catch (error) {
      console.error('Error loading shift rule groups:', error);
      setError('Failed to load shift rule groups');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(config: Partial<TenantShiftConfig>) {
    if (!user?.tenant_id) return;

    try {
      if (selectedGroup) {
        await updateShiftRuleGroup(selectedGroup.id, config);
      } else {
        await createShiftRuleGroup(user.tenant_id, config);
      }
      await loadGroups();
      setShowForm(false);
      setSelectedGroup(undefined);
    } catch (error) {
      throw error;
    }
  }

  async function handleDuplicate(id: string) {
    if (!user?.tenant_id) return;

    try {
      const group = groups.find(g => g.id === id);
      if (!group) return;

      const { id: _id, created_at: _c, updated_at: _u, ...config } = group;
      await createShiftRuleGroup(user.tenant_id, {
        ...config,
        name: `${config.name} (Copy)`
      });
      await loadGroups();
    } catch (error) {
      console.error('Error duplicating group:', error);
      setError('Failed to duplicate group');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this rule group?')) return;

    try {
      await deleteShiftRuleGroup(id);
      await loadGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      setError('Failed to delete group');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Shift Rules</h1>
        <button
          onClick={() => {
            setSelectedGroup(undefined);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Rule Group
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {showForm ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <ShiftRuleGroupForm
              group={selectedGroup}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setSelectedGroup(undefined);
              }}
            />
          </div>
        </div>
      ) : selectedGroup ? (
        <ShiftRulesSummary config={selectedGroup} />
      ) : (
        <div className="space-y-6">
          <ShiftRuleGroupList
            groups={groups}
            onEdit={(id) => {
              setSelectedGroup(groups.find(g => g.id === id));
              setShowForm(true);
            }}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
          
          <ShiftRulesKnowledgeBase />
        </div>
      )}
    </div>
  );
}