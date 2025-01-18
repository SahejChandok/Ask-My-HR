@@ .. @@
   const { data, error } = await supabase
     .from('employee_profiles')
     .update({
       ...employee,
+      shift_rule_group_id: employee.shift_rule_group_id,
       updated_at: new Date().toISOString()
     })
     .eq('id', employee.id)
@@ .. @@